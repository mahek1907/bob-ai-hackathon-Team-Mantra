"""
GridSentinel AI — Real-Time Risk Recalculation Service
Module: src/services/risk_service.py

Orchestrates multi-variable risk recalculation across live MQTT telemetry,
live Open-Meteo weather, and topological grid criticality. Dispatches
real-time updates to connected WebSocket subscribers.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional

try:
    from ..risk_engine import calculate_comprehensive_risk
    from ..criticality_engine import calculate_grid_criticality
    from .telemetry_service import TelemetryService
    from .weather_service import WeatherService
except ImportError:
    from risk_engine import calculate_comprehensive_risk  # type: ignore
    from criticality_engine import calculate_grid_criticality  # type: ignore
    from services.telemetry_service import TelemetryService  # type: ignore
    from services.weather_service import WeatherService  # type: ignore

logger = logging.getLogger("grid_sentinel.risk_service")


class RiskService:
    """Central risk synthesizer linking real-time data feeds with analytical models."""

    def __init__(
        self,
        telemetry_service: TelemetryService,
        weather_service: WeatherService,
        substations: Optional[List[Dict[str, Any]]] = None
    ):
        self.telemetry = telemetry_service
        self.weather_svc = weather_service

        if substations is None:
            import json
            from pathlib import Path
            sub_path = Path(__file__).resolve().parent.parent / "data" / "grid_criticality.json"
            if sub_path.exists():
                try:
                    with open(sub_path, "r", encoding="utf-8") as f:
                        substations = json.load(f)
                except Exception:
                    substations = []
            else:
                substations = []

        self.raw_substations = substations or []
        self._listeners: List[Callable[[Dict[str, Any]], Any]] = []
        self._last_state: Optional[Dict[str, Any]] = None

    def register_listener(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        """Register a callback (e.g. WebSocket broadcast) to receive live risk state updates."""
        if callback not in self._listeners:
            self._listeners.append(callback)

    def unregister_listener(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        if callback in self._listeners:
            self._listeners.remove(callback)

    def enrich_substations(self) -> List[Dict[str, Any]]:
        """Pre-compute criticality scores for all substations."""
        enriched = []
        for s in self.raw_substations:
            c_res = calculate_grid_criticality(s)
            copy_s = dict(s)
            copy_s["computed_criticality"] = c_res["criticality_score"]
            copy_s["criticality_score"] = c_res["criticality_score"]
            copy_s["criticality_factors"] = c_res["criticality_factors"]
            enriched.append(copy_s)
        return enriched

    def recalculate(self, notify: bool = True) -> Dict[str, Any]:
        """
        Execute comprehensive multi-variable risk engine across all active transformer assets.
        Synthesizes physical telemetry, Open-Meteo weather, and substation criticality.
        """
        assets = self.telemetry.get_all_assets()
        weather = self.weather_svc.get_weather()
        substations = self.enrich_substations()

        if not assets:
            empty_state = {
                "summary": {},
                "ranked_assets": [],
                "weather": weather,
                "substations": substations,
                "mode": "OFFLINE_FALLBACK",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            self._last_state = empty_state
            return empty_state

        # Execute analytical risk engine
        raw_ranked = calculate_comprehensive_risk(assets, weather, substations)

        raw_map = {str(a.get("asset_id")).upper(): a for a in assets}
        sub_map = {str(s.get("substation_id")).upper(): s for s in substations}

        enriched_ranked = []
        for r in raw_ranked:
            aid = str(r.get("asset_id")).upper()
            sid = str(r.get("substation_id")).upper()
            raw = raw_map.get(aid, {})
            sub = sub_map.get(sid, {})

            crit_info = calculate_grid_criticality(sub) if sub else {"criticality_score": 50, "criticality_factors": []}

            item = dict(r)
            item["model"] = raw.get("model", "High-Voltage Power Transformer")
            item["age_years"] = raw.get("age_years", 20)
            item["oil_temp_c"] = raw.get("oil_temp_c") or r.get("telemetry_snapshot", {}).get("oil_temperature")
            item["winding_temp_c"] = raw.get("winding_temp_c")
            item["vibration_mms"] = raw.get("vibration_mms") or r.get("telemetry_snapshot", {}).get("vibration_level")
            item["load_pct"] = raw.get("load_pct") or r.get("telemetry_snapshot", {}).get("electrical_load_pct")
            item["dga_ppm"] = raw.get("dga_ppm", {})

            item["substation_name"] = sub.get("name", sid)
            item["customers_served"] = sub.get("customers_served", 0)
            item["criticality_factors"] = crit_info.get("criticality_factors", [])
            item["hospital_connected"] = sub.get("hospital_connected", False)
            item["transit_connected"] = sub.get("transit_connected", False)
            item["water_plant_connected"] = sub.get("water_plant_connected", False)

            enriched_ranked.append(item)

        # High-level KPIs
        critical_count = sum(1 for r in enriched_ranked if r["risk_category"] == "CRITICAL")
        high_count = sum(1 for r in enriched_ranked if r["risk_category"] == "HIGH")
        medium_count = sum(1 for r in enriched_ranked if r["risk_category"] == "MEDIUM")
        low_count = sum(1 for r in enriched_ranked if r["risk_category"] == "LOW")

        total_customers = sum(r.get("customers_served", 0) for r in enriched_ranked)
        customers_at_risk = sum(
            r.get("customers_served", 0)
            for r in enriched_ranked
            if r["risk_category"] in ("CRITICAL", "HIGH")
        )

        avg_score = round(sum(r["composite_risk_score"] for r in enriched_ranked) / len(enriched_ranked), 1)
        max_score = max(r["composite_risk_score"] for r in enriched_ranked)
        max_weather_mult = max((r.get("weather_multiplier", 1.0) for r in enriched_ranked), default=1.0)

        is_live = self.telemetry.is_live_active and not weather.get("is_offline_fallback", False)
        mode = "LIVE" if self.telemetry.has_received_live else "OFFLINE_FALLBACK"

        summary = {
            "total_assets": len(enriched_ranked),
            "total_monitored_assets": len(enriched_ranked),
            "critical_count": critical_count,
            "critical_assets_count": critical_count,
            "high_count": high_count,
            "high_risk_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "fleet_health_index": round(max(0.0, min(100.0, 100.0 - avg_score)), 1),
            "avg_risk_score": avg_score,
            "max_risk_score": max_score,
            "weather_event": weather.get("event_name", "Live Weather"),
            "ambient_temp_c": weather.get("ambient_temp_c", 25.0),
            "wind_speed_kmh": weather.get("wind_speed_kmh", 15.0),
            "lightning_strikes": weather.get("lightning_strikes_last_hour", 0),
            "weather_multiplier": round(max_weather_mult, 2),
            "total_customers_served": total_customers,
            "customers_at_risk": customers_at_risk,
            "monitoring_mode": mode,
            "telemetry_source": "MQTT_SIMULATED_SCADA" if self.telemetry.has_received_live else "OFFLINE_JSON",
            "weather_source": weather.get("source", "UNKNOWN"),
        }

        full_state = {
            "type": "FLEET_RISK_UPDATE",
            "mode": mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_telemetry_time": self.telemetry.last_update_timestamp,
            "summary": summary,
            "ranked_assets": enriched_ranked,
            "weather": weather,
            "substations": substations,
        }

        self._last_state = full_state

        if notify and self._listeners:
            for listener in list(self._listeners):
                try:
                    listener(full_state)
                except Exception as e:
                    logger.error(f"Error dispatching risk state to listener: {e}")

        return full_state

    def get_latest_state(self) -> Dict[str, Any]:
        """Return the most recently calculated state or trigger a fresh recalculation."""
        if self._last_state is None:
            return self.recalculate(notify=False)
        return self._last_state

    def get_current_state(self) -> Dict[str, Any]:
        """Alias for get_latest_state()."""
        return self.get_latest_state()

    def initialize(self) -> None:
        """Calculate initial risk baseline without broadcasting."""
        self.recalculate(notify=False)

    def subscribe(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        """Alias for register_listener()."""
        self.register_listener(callback)

