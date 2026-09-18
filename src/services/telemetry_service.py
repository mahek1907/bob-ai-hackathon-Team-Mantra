"""
GridSentinel AI — Real-Time Transformer Telemetry Service
Module: src/services/telemetry_service.py

Maintains the authoritative in-memory state of transformer physical
telemetry and DGA gas concentrations. Ingests simulated SCADA sensor
streams via MQTT, validates and normalizes all metrics safely,
and maintains fallback offline baselines.

DISCLAIMER:
Labeled internally as "Real-time simulated transformer sensor/SCADA telemetry"
for hackathon demonstration purposes.
"""

from __future__ import annotations

import copy
import json
import logging
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("grid_sentinel.telemetry_service")


def _safe_float(val: Any, default: Optional[float] = None) -> Optional[float]:
    """Safely convert value to float, filtering None, bool, NaN, and Inf."""
    if val is None or isinstance(val, bool):
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


class TelemetryService:
    """In-memory telemetry state registry with resilient multi-source ingestion."""

    def __init__(self, baseline_path: Optional[Path] = None):
        self._baseline_path = baseline_path or (
            Path(__file__).resolve().parent.parent / "data" / "transformer_telemetry.json"
        )
        self._transformers: Dict[str, Dict[str, Any]] = {}
        self._last_update_ts: Optional[str] = None
        self._update_counter: int = 0
        self._has_received_live: bool = False
        self._last_live_receive_time: float = 0.0
        self._listeners: List[Callable[[str, Dict[str, Any]], None]] = []

        self.load_baseline()

    def load_baseline(self) -> None:
        """Initialize in-memory registry from static JSON baseline dataset."""
        if not self._baseline_path.exists():
            logger.warning(f"Baseline telemetry file not found at {self._baseline_path}")
            return

        try:
            with open(self._baseline_path, "r", encoding="utf-8") as f:
                raw_list = json.load(f)
                if isinstance(raw_list, list):
                    for item in raw_list:
                        if isinstance(item, dict) and "asset_id" in item:
                            aid = str(item["asset_id"]).strip().upper()
                            c_item = copy.deepcopy(item)
                            if "oil_temp_c" in c_item and "oil_temperature" not in c_item:
                                c_item["oil_temperature"] = c_item["oil_temp_c"]
                            if "vibration_mms" in c_item and "vibration" not in c_item:
                                c_item["vibration"] = c_item["vibration_mms"]
                            if "load_pct" in c_item and "load_percent" not in c_item:
                                c_item["load_percent"] = c_item["load_pct"]
                            self._transformers[aid] = c_item
                    logger.info(f"Loaded {len(self._transformers)} transformer baselines.")
        except Exception as e:
            logger.error(f"Error loading baseline telemetry: {e}")

    def update_from_payload(self, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Ingest, validate, and normalize a telemetry message from MQTT.
        Supports diverse schema variations, aliased field names, and nested DGA dictionaries.
        """
        if not isinstance(payload, dict):
            logger.warning("Rejected non-dict telemetry payload")
            return None

        # Resolve asset ID
        raw_id = payload.get("transformer_id") or payload.get("asset_id") or payload.get("id")
        if not raw_id:
            logger.warning("Telemetry payload missing transformer_id or asset_id")
            return None

        asset_id = str(raw_id).strip().upper()

        # Retrieve existing record or construct minimal record
        existing = self._transformers.get(asset_id, {
            "asset_id": asset_id,
            "substation_id": payload.get("substation_id", "SUB-UNKNOWN"),
            "model": payload.get("model", "High-Voltage Power Transformer"),
            "age_years": payload.get("age_years", 20),
            "dga_ppm": {}
        })

        record = copy.deepcopy(existing)

        # 1. Update Oil & Winding Temperatures
        oil_temp = _safe_float(
            payload.get("oil_temperature")
            or payload.get("oil_temp_c")
            or payload.get("oil_temp")
        )
        if oil_temp is not None:
            clamped_oil = max(-40.0, min(200.0, oil_temp))
            record["oil_temp_c"] = round(clamped_oil, 1)
            record["oil_temperature"] = round(clamped_oil, 1)

        winding_temp = _safe_float(
            payload.get("winding_temp_c")
            or payload.get("winding_temp")
            or payload.get("winding_temperature")
        )
        if winding_temp is not None:
            clamped_winding = max(-40.0, min(250.0, winding_temp))
            record["winding_temp_c"] = round(clamped_winding, 1)
        elif oil_temp is not None and "winding_temp_c" in record:
            # Maintain realistic thermal gradient if winding temp not explicitly reported
            record["winding_temp_c"] = round(max(record["winding_temp_c"], record["oil_temp_c"] + 10.0), 1)

        # 2. Update Vibration Level
        vibration = _safe_float(
            payload.get("vibration")
            or payload.get("vibration_mms")
            or payload.get("vibration_level")
        )
        if vibration is not None:
            clamped_vib = max(0.0, min(50.0, vibration))
            record["vibration_mms"] = round(clamped_vib, 2)
            record["vibration_level"] = round(clamped_vib, 2)
            record["vibration"] = round(clamped_vib, 2)

        # 3. Update Grid Loading Percentage
        load_pct = _safe_float(
            payload.get("load_percent")
            or payload.get("load_pct")
            or payload.get("electrical_load_pct")
            or payload.get("load")
        )
        if load_pct is not None:
            clamped_load = max(0.0, min(300.0, load_pct))
            record["load_pct"] = round(clamped_load, 1)
            record["electrical_load_pct"] = round(clamped_load, 1)
            record["load_percent"] = round(clamped_load, 1)

        # 4. Update Dissolved Gas Analysis (DGA) in ppm
        dga_dict = record.get("dga_ppm", {})
        if not isinstance(dga_dict, dict):
            dga_dict = {}

        # Check for nested dga_ppm dict in incoming payload
        incoming_dga = payload.get("dga_ppm")
        if isinstance(incoming_dga, dict):
            for k, v in incoming_dga.items():
                parsed = _safe_float(v)
                if parsed is not None:
                    # Support DGA gas aliases inside nested dict
                    k_str = str(k).lower().strip()
                    gas_norm = (
                        "acetylene" if k_str in ("c2h2", "c2h2_ppm") else
                        "methane" if k_str in ("ch4", "ch4_ppm") else
                        "ethane" if k_str in ("c2h6", "c2h6_ppm") else
                        "ethylene" if k_str in ("c2h4", "c2h4_ppm") else
                        "hydrogen" if k_str in ("h2", "h2_ppm") else
                        "carbon_monoxide" if k_str in ("co", "co_ppm") else
                        k_str
                    )
                    dga_dict[gas_norm] = round(max(0.0, parsed), 1)

        # Check top-level flattened DGA keys
        gas_mappings = {
            "hydrogen": ["hydrogen_ppm", "h2_ppm", "hydrogen", "h2"],
            "methane": ["methane_ppm", "ch4_ppm", "methane", "ch4"],
            "ethane": ["ethane_ppm", "c2h6_ppm", "ethane", "c2h6"],
            "ethylene": ["ethylene_ppm", "c2h4_ppm", "ethylene", "c2h4"],
            "acetylene": ["c2h2_ppm", "c2h2", "acetylene_ppm", "acetylene"],
        }

        for gas_std, aliases in gas_mappings.items():
            for alias in aliases:
                if alias in payload:
                    parsed = _safe_float(payload[alias])
                    if parsed is not None:
                        dga_dict[gas_std] = round(max(0.0, parsed), 1)
                        break

        record["dga_ppm"] = dga_dict

        # Metadata
        record["last_telemetry_timestamp"] = (
            payload.get("timestamp") or datetime.now(timezone.utc).isoformat()
        )
        record["telemetry_source"] = "MQTT_SIMULATED_SCADA"
        record["is_live"] = True

        # Update registry state
        self._transformers[asset_id] = record
        self._last_update_ts = record["last_telemetry_timestamp"]
        self._update_counter += 1
        self._has_received_live = True
        self._last_live_receive_time = time.time()

        # Notify subscribers
        for listener in list(self._listeners):
            try:
                listener(asset_id, record)
            except Exception as e:
                logger.error(f"Error in telemetry listener callback: {e}")

        return record

    def update_telemetry(self, asset_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convenience method accepting asset_id and payload separately."""
        p = dict(payload)
        p["asset_id"] = asset_id
        return self.update_from_payload(p)

    def get_all_telemetry(self) -> Dict[str, Dict[str, Any]]:
        """Return dict keyed by asset_id for test and diagnostic lookups."""
        return {str(a["asset_id"]).upper(): a for a in self.get_all_assets()}

    def load_initial_data(self) -> None:
        """Alias for load_baseline()."""
        self.load_baseline()

    def subscribe(self, listener: Callable[[str, Dict[str, Any]], None]) -> None:
        """Register a subscriber callback receiving (asset_id, record)."""
        self._listeners.append(listener)

    def get_all_assets(self) -> List[Dict[str, Any]]:
        """Return list of all registered transformer telemetry objects."""
        return list(self._transformers.values())

    def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve telemetry record for a specific transformer asset."""
        return self._transformers.get(str(asset_id).strip().upper())

    @property
    def has_received_live(self) -> bool:
        return self._has_received_live

    @property
    def is_live_active(self) -> bool:
        """Check if live MQTT telemetry has arrived within the last 60 seconds."""
        if not self._has_received_live:
            return False
        return (time.time() - self._last_live_receive_time) < 60.0

    @property
    def last_update_timestamp(self) -> Optional[str]:
        return self._last_update_ts

    @property
    def update_count(self) -> int:
        return self._update_counter

