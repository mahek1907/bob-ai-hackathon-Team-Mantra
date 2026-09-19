"""
GridSentinel AI — Real-Time Risk Recalculation Service
Module: src/services/risk_service.py

Orchestrates multi-variable risk recalculation across live MQTT telemetry,
live Open-Meteo weather, and topological grid criticality. Dispatches
real-time updates and dynamic IBM Granite maintenance directives to
connected WebSocket subscribers.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

try:
    from ..risk_engine import calculate_comprehensive_risk
    from ..criticality_engine import calculate_grid_criticality
    from ..work_order_generator import (
        build_structured_risk_context,
        generate_granite_directive_payload,
    )
    from .telemetry_service import TelemetryService
    from .weather_service import WeatherService
except ImportError:
    from risk_engine import calculate_comprehensive_risk  # type: ignore
    from criticality_engine import calculate_grid_criticality  # type: ignore
    from work_order_generator import (  # type: ignore
        build_structured_risk_context,
        generate_granite_directive_payload,
    )
    from services.telemetry_service import TelemetryService  # type: ignore
    from services.weather_service import WeatherService  # type: ignore

logger = logging.getLogger("grid_sentinel.risk_service")


class RiskService:
    """Central risk synthesizer linking real-time data feeds with analytical models and live Granite directives."""

    def __init__(
        self,
        telemetry_service: TelemetryService,
        weather_service: WeatherService,
        substations: Optional[List[Dict[str, Any]]] = None
    ):
        self.telemetry = telemetry_service
        self.weather_svc = weather_service

        if substations is None:
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

        # Ingest historical incidents
        self.historical_incidents: List[Dict[str, Any]] = []
        try:
            candidates = [
                Path(__file__).resolve().parent.parent / "data" / "historical_incidents.json",
                Path.cwd() / "src" / "data" / "historical_incidents.json",
                Path.cwd() / "data" / "historical_incidents.json",
            ]
            for p in candidates:
                if p.exists():
                    with open(p, "r", encoding="utf-8") as f:
                        self.historical_incidents = json.load(f)
                        break
        except Exception:
            pass

        # Directive management & cooldown tracking
        self._active_directive: Optional[Dict[str, Any]] = None
        self._last_directive_time: float = 0.0
        self._directive_cooldown_seconds: float = float(os.getenv("GRANITE_DIRECTIVE_COOLDOWN_SECONDS", "30"))

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

    def should_regenerate_directive(
        self,
        top_asset: Dict[str, Any],
        weather: Dict[str, Any],
        force: bool = False
    ) -> bool:
        """
        Determine whether a new IBM Granite directive must be synthesized.
        Triggers on:
        1. Explicit force flag (user trigger / test override)
        2. No active directive exists (startup baseline)
        3. Highest-risk transformer changed (e.g. TX-401 -> TX-102)
        4. Risk severity tier changed (e.g. HIGH -> CRITICAL)
        5. Material risk score change (|delta| >= 5.0)
        6. Important DGA condition change (|delta C2H2| >= 15.0)
        7. Material weather compounding change (|delta multiplier| >= 0.2)
        """
        if force or self._active_directive is None:
            return True

        prev = self._active_directive
        # 1. Target asset changed
        prev_aid = str(prev.get("directive_transformer_id") or prev.get("transformer_id") or "").upper()
        curr_aid = str(top_asset.get("asset_id", "")).upper()
        if prev_aid != curr_aid:
            return True

        # 2. Risk severity tier changed
        prev_tier = str(prev.get("risk_level", "")).upper()
        curr_tier = str(top_asset.get("risk_category", "")).upper()
        if prev_tier and curr_tier and prev_tier != curr_tier:
            return True

        # 3. Material risk score change (>= 5.0 points)
        prev_score = float(prev.get("directive_risk_score", prev.get("risk_score", 0.0)))
        curr_score = float(top_asset.get("composite_risk_score", 0.0))
        if abs(curr_score - prev_score) >= 5.0:
            return True

        # 4. DGA condition change (C2H2 changed by >= 15 ppm)
        prev_ctx = prev.get("context", {})
        prev_telem = prev_ctx.get("telemetry", {})
        prev_c2h2 = float(prev_telem.get("c2h2_ppm", 0.0))
        curr_c2h2 = float(top_asset.get("dga_ppm", {}).get("acetylene", 0.0))
        if abs(curr_c2h2 - prev_c2h2) >= 15.0:
            return True

        # 5. Weather compounding change (multiplier change >= 0.2)
        prev_w_mult = float(prev_ctx.get("weather", {}).get("weather_risk_multiplier", 1.0))
        curr_w_mult = float(top_asset.get("weather_multiplier", 1.0))
        if abs(curr_w_mult - prev_w_mult) >= 0.2:
            return True

        return False

    def recalculate(self, notify: bool = True, force_directive: bool = False) -> Dict[str, Any]:
        """
        Execute comprehensive multi-variable risk engine across all active transformer assets.
        Synthesizes physical telemetry, Open-Meteo weather, and substation criticality.
        Dynamically manages the active IBM Granite directive based on material change and cooldown.
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
                "active_directive": self._active_directive,
                "directive_updated": False,
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

        # ---------------------------------------------------------------------
        # Dynamic Directive Management & Debounce
        # ---------------------------------------------------------------------
        top_asset = enriched_ranked[0] if enriched_ranked else None
        directive_updated = False

        if top_asset:
            cooldown_limit = float(os.getenv("GRANITE_DIRECTIVE_COOLDOWN_SECONDS", str(self._directive_cooldown_seconds)))
            needs_regen = self.should_regenerate_directive(top_asset, weather, force=force_directive)
            time_since_last = time.time() - self._last_directive_time
            cooldown_elapsed = (time_since_last >= cooldown_limit) or force_directive or (self._active_directive is None)

            if needs_regen:
                if cooldown_elapsed:
                    ctx = build_structured_risk_context(
                        asset=top_asset,
                        weather=weather,
                        substations=substations,
                        historical_incidents=self.historical_incidents
                    )
                    self._active_directive = generate_granite_directive_payload(ctx)
                    self._last_directive_time = time.time()
                    directive_updated = True
                    logger.info(
                        f"Generated dynamic directive for {top_asset.get('asset_id')} "
                        f"(Score: {top_asset.get('composite_risk_score')}, Category: {top_asset.get('risk_category')})"
                    )
                else:
                    # Mark active directive as stale until cooldown window permits regeneration
                    if self._active_directive:
                        self._active_directive["is_stale"] = True

        full_state = {
            "type": "FLEET_RISK_UPDATE",
            "mode": mode,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "last_telemetry_time": self.telemetry.last_update_timestamp,
            "summary": summary,
            "ranked_assets": enriched_ranked,
            "weather": weather,
            "substations": substations,
            "active_directive": self._active_directive,
            "directive_updated": directive_updated,
        }

        self._last_state = full_state

        if notify and self._listeners:
            for listener in list(self._listeners):
                try:
                    listener(full_state)
                except Exception as e:
                    logger.error(f"Error dispatching risk state to listener: {e}")

        return full_state

    def get_active_directive(self) -> Optional[Dict[str, Any]]:
        """Return the current active directive payload, generating one if none exists."""
        if self._active_directive is None:
            self.recalculate(notify=False, force_directive=True)
        return self._active_directive

    def set_active_directive(self, payload: Dict[str, Any]) -> None:
        """Store an explicitly generated directive payload."""
        self._active_directive = payload
        self._last_directive_time = time.time()

    def generate_directive_for_asset(self, asset_id: str, force: bool = True) -> Dict[str, Any]:
        """Explicitly generate a directive for an arbitrary asset, bypassing cooldown."""
        state = self.get_latest_state()
        target = next((a for a in state["ranked_assets"] if str(a.get("asset_id")).upper() == asset_id.upper()), None)
        if not target:
            raw = self.telemetry.get_asset(asset_id)
            if not raw:
                raise ValueError(f"Asset '{asset_id}' not found in telemetry registry.")
            target = dict(raw)

        weather = state.get("weather", self.weather_svc.get_weather())
        substations = state.get("substations", self.enrich_substations())
        ctx = build_structured_risk_context(
            asset=target,
            weather=weather,
            substations=substations,
            historical_incidents=self.historical_incidents
        )
        directive_payload = generate_granite_directive_payload(ctx)
        self._active_directive = directive_payload
        self._last_directive_time = time.time()
        return directive_payload

    def get_latest_state(self) -> Dict[str, Any]:
        """Return the most recently calculated state or trigger a fresh recalculation."""
        if self._last_state is None:
            return self.recalculate(notify=False)
        return self._last_state

    def get_current_state(self) -> Dict[str, Any]:
        """Alias for get_latest_state()."""
        return self.get_latest_state()

    def initialize(self) -> None:
        """Calculate initial risk baseline and initial directive without broadcasting."""
        self.recalculate(notify=False, force_directive=True)

    def subscribe(self, callback: Callable[[Dict[str, Any]], Any]) -> None:
        """Alias for register_listener()."""
        self.register_listener(callback)
