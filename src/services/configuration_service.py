"""
GridSentinel AI — Centralized Configuration Service
Module: src/services/configuration_service.py

Authoritative single source of truth for workstation diagnostic threshold overrides,
telemetry polling rates, and automated IBM Granite work-order drafting preferences.
Persists settings across server restarts and page reloads via src/data/system_configuration.json.
"""

from __future__ import annotations

import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

logger = logging.getLogger("grid_sentinel.configuration_service")

# Default workstation thresholds and settings
DEFAULT_CONFIGURATION: Dict[str, Any] = {
    "c2h2_arcing_threshold_ppm": 80.0,
    "max_oil_temperature_c": 105.0,
    "vibration_warning_mms": 7.0,
    "auto_draft_directives": False,
    "polling_interval": "30s",
    "critical_audio_alerts": True,
}

VALID_POLLING_INTERVALS = ["10s", "30s", "60s", "5m"]


class ConfigurationService:
    """
    Manages persistent system configuration and live in-memory threshold states.
    Dispatches change notifications to registered listeners (e.g. RiskService).
    """

    def __init__(self, config_path: Optional[Path] = None):
        if config_path is None:
            config_path = (
                Path(__file__).resolve().parent.parent / "data" / "system_configuration.json"
            )
        self.config_path = config_path
        self._lock = threading.RLock()
        self._listeners: List[Callable[[Dict[str, Any]], None]] = []
        self._config: Dict[str, Any] = dict(DEFAULT_CONFIGURATION)
        self._updated_at: str = datetime.now(timezone.utc).isoformat()
        self.load()

    def register_listener(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register a callback to be invoked immediately whenever configuration changes."""
        if callback not in self._listeners:
            self._listeners.append(callback)

    def unregister_listener(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        if callback in self._listeners:
            self._listeners.remove(callback)

    def load(self) -> Dict[str, Any]:
        """Load persistent configuration from JSON file or initialize with defaults."""
        with self._lock:
            if self.config_path.exists():
                try:
                    with open(self.config_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    # Extract nested or flat keys
                    loaded = self._normalize_input(data)
                    self._validate_dict(loaded)
                    self._config.update(loaded)
                    self._updated_at = data.get(
                        "updated_at", datetime.now(timezone.utc).isoformat()
                    )
                    logger.info(f"Loaded persistent configuration from {self.config_path}")
                except Exception as e:
                    logger.warning(
                        f"Could not load {self.config_path} ({e}). Falling back to defaults."
                    )
                    self._save_unlocked()
            else:
                logger.info(f"Creating default configuration at {self.config_path}")
                self._save_unlocked()

            return self._build_export_payload()

    def _save_unlocked(self) -> None:
        """Save current configuration to JSON file (must be called under _lock)."""
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        payload = self._build_export_payload()
        tmp_path = self.config_path.with_suffix(".tmp")
        try:
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            tmp_path.replace(self.config_path)
        except Exception as e:
            logger.error(f"Failed to persist configuration to {self.config_path}: {e}")
            if tmp_path.exists():
                try:
                    tmp_path.unlink()
                except Exception:
                    pass
            raise IOError(f"Failed to persist configuration: {e}")

    def _build_export_payload(self) -> Dict[str, Any]:
        """Build structured payload containing both flat keys and grouped sections."""
        now_iso = self._updated_at or datetime.now(timezone.utc).isoformat()
        return {
            "c2h2_arcing_threshold_ppm": float(self._config["c2h2_arcing_threshold_ppm"]),
            "max_oil_temperature_c": float(self._config["max_oil_temperature_c"]),
            "vibration_warning_mms": float(self._config["vibration_warning_mms"]),
            "auto_draft_directives": bool(self._config["auto_draft_directives"]),
            "polling_interval": str(self._config["polling_interval"]),
            "critical_audio_alerts": bool(self._config["critical_audio_alerts"]),
            "dga": {
                "c2h2_arcing_threshold_ppm": float(self._config["c2h2_arcing_threshold_ppm"]),
            },
            "thermal": {
                "max_oil_temperature_c": float(self._config["max_oil_temperature_c"]),
            },
            "mechanical": {
                "vibration_warning_mms": float(self._config["vibration_warning_mms"]),
            },
            "granite": {
                "auto_draft_directives": bool(self._config["auto_draft_directives"]),
            },
            "workstation": {
                "polling_interval": str(self._config["polling_interval"]),
                "critical_audio_alerts": bool(self._config["critical_audio_alerts"]),
            },
            "status": "SAVED & ACTIVE",
            "updated_at": now_iso,
        }

    def _normalize_input(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw incoming dict that might use nested or flat keys."""
        normalized: Dict[str, Any] = {}

        # 1. Direct flat keys
        for k in DEFAULT_CONFIGURATION:
            if k in raw and raw[k] is not None:
                normalized[k] = raw[k]

        # 2. Aliases and nested sections
        if "dga" in raw and isinstance(raw["dga"], dict):
            c2h2_val = raw["dga"].get("c2h2_arcing_threshold_ppm") or raw["dga"].get(
                "arcing_threshold"
            )
            if c2h2_val is not None:
                normalized["c2h2_arcing_threshold_ppm"] = c2h2_val

        if "thermal" in raw and isinstance(raw["thermal"], dict):
            temp_val = raw["thermal"].get("max_oil_temperature_c") or raw["thermal"].get(
                "temp_limit"
            )
            if temp_val is not None:
                normalized["max_oil_temperature_c"] = temp_val

        if "mechanical" in raw and isinstance(raw["mechanical"], dict):
            vib_val = raw["mechanical"].get("vibration_warning_mms") or raw["mechanical"].get(
                "vibration_limit"
            )
            if vib_val is not None:
                normalized["vibration_warning_mms"] = vib_val

        if "granite" in raw and isinstance(raw["granite"], dict):
            auto_val = raw["granite"].get("auto_draft_directives") or raw["granite"].get(
                "auto_modal"
            )
            if auto_val is not None:
                normalized["auto_draft_directives"] = auto_val

        if "workstation" in raw and isinstance(raw["workstation"], dict):
            rate_val = raw["workstation"].get("polling_interval")
            if rate_val is not None:
                normalized["polling_interval"] = rate_val
            audio_val = raw["workstation"].get("critical_audio_alerts")
            if audio_val is not None:
                normalized["critical_audio_alerts"] = audio_val

        # Aliases from frontend naming
        if "arcingThreshold" in raw and "c2h2_arcing_threshold_ppm" not in normalized:
            normalized["c2h2_arcing_threshold_ppm"] = raw["arcingThreshold"]
        if "tempLimit" in raw and "max_oil_temperature_c" not in normalized:
            normalized["max_oil_temperature_c"] = raw["tempLimit"]
        if "vibrationLimit" in raw and "vibration_warning_mms" not in normalized:
            normalized["vibration_warning_mms"] = raw["vibrationLimit"]
        if "autoModal" in raw and "auto_draft_directives" not in normalized:
            normalized["auto_draft_directives"] = raw["autoModal"]
        if "soundAlarms" in raw and "critical_audio_alerts" not in normalized:
            normalized["critical_audio_alerts"] = raw["soundAlarms"]
        if "pollingInterval" in raw and "polling_interval" not in normalized:
            normalized["polling_interval"] = raw["pollingInterval"]

        return normalized

    def _validate_dict(self, candidate: Dict[str, Any]) -> None:
        """Validate candidate configuration values against physical engineering boundaries."""
        # 1. C2H2 Arcing Threshold
        if "c2h2_arcing_threshold_ppm" in candidate:
            val = candidate["c2h2_arcing_threshold_ppm"]
            if val is None or isinstance(val, bool):
                raise ValueError("Arcing trigger (C2H2) must be a numeric value.")
            try:
                f_val = float(val)
            except (TypeError, ValueError):
                raise ValueError(f"Arcing trigger (C2H2) '{val}' is not a valid number.")
            if f_val <= 0.0 or f_val > 500.0:
                raise ValueError(
                    f"Arcing trigger (C2H2) must be between 5.0 and 500.0 ppm (got {f_val})."
                )

        # 2. Max Oil Temperature
        if "max_oil_temperature_c" in candidate:
            val = candidate["max_oil_temperature_c"]
            if val is None or isinstance(val, bool):
                raise ValueError("Max oil temperature must be a numeric value.")
            try:
                f_val = float(val)
            except (TypeError, ValueError):
                raise ValueError(f"Max oil temperature '{val}' is not a valid number.")
            if f_val < 50.0 or f_val > 180.0:
                raise ValueError(
                    f"Max oil temperature must be between 50.0°C and 180.0°C (got {f_val})."
                )

        # 3. Vibration Warning
        if "vibration_warning_mms" in candidate:
            val = candidate["vibration_warning_mms"]
            if val is None or isinstance(val, bool):
                raise ValueError("Vibration warning must be a numeric value.")
            try:
                f_val = float(val)
            except (TypeError, ValueError):
                raise ValueError(f"Vibration warning '{val}' is not a valid number.")
            if f_val <= 0.0 or f_val > 50.0:
                raise ValueError(
                    f"Vibration warning must be between 1.0 and 50.0 mm/s (got {f_val})."
                )

        # 4. Auto Draft Directives
        if "auto_draft_directives" in candidate:
            val = candidate["auto_draft_directives"]
            if not isinstance(val, bool) and val not in ("true", "false", "True", "False", 0, 1):
                raise ValueError("Auto-Draft IBM Granite Directives must be a boolean flag.")

        # 5. Polling Interval
        if "polling_interval" in candidate:
            val = candidate["polling_interval"]
            if str(val).lower() not in [i.lower() for i in VALID_POLLING_INTERVALS]:
                raise ValueError(
                    f"Polling interval must be one of {VALID_POLLING_INTERVALS} (got '{val}')."
                )

        # 6. Critical Audio Alerts
        if "critical_audio_alerts" in candidate:
            val = candidate["critical_audio_alerts"]
            if not isinstance(val, bool) and val not in ("true", "false", "True", "False", 0, 1):
                raise ValueError("Critical audio alerts must be a boolean flag.")

    def get_configuration(self) -> Dict[str, Any]:
        """Return the current active configuration dictionary."""
        with self._lock:
            return self._build_export_payload()

    def to_dict(self) -> Dict[str, Any]:
        """Convenience alias for get_configuration()."""
        return self.get_configuration()

    def update_configuration(self, candidate_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate, persist, activate, and broadcast configuration updates.
        Returns the updated configuration.
        """
        if not isinstance(candidate_input, dict):
            raise ValueError("Configuration payload must be a JSON dictionary.")

        normalized = self._normalize_input(candidate_input)
        if not normalized:
            raise ValueError("No valid configuration fields provided in update request.")

        # Validate strictly before applying
        self._validate_dict(normalized)

        # Clean types
        cleaned: Dict[str, Any] = {}
        if "c2h2_arcing_threshold_ppm" in normalized:
            cleaned["c2h2_arcing_threshold_ppm"] = float(normalized["c2h2_arcing_threshold_ppm"])
        if "max_oil_temperature_c" in normalized:
            cleaned["max_oil_temperature_c"] = float(normalized["max_oil_temperature_c"])
        if "vibration_warning_mms" in normalized:
            cleaned["vibration_warning_mms"] = float(normalized["vibration_warning_mms"])
        if "auto_draft_directives" in normalized:
            v = normalized["auto_draft_directives"]
            cleaned["auto_draft_directives"] = True if v in (True, "true", "True", 1) else False
        if "polling_interval" in normalized:
            cleaned["polling_interval"] = str(normalized["polling_interval"])
        if "critical_audio_alerts" in normalized:
            v = normalized["critical_audio_alerts"]
            cleaned["critical_audio_alerts"] = True if v in (True, "true", "True", 1) else False

        with self._lock:
            self._config.update(cleaned)
            self._updated_at = datetime.now(timezone.utc).isoformat()
            self._save_unlocked()
            result = self._build_export_payload()

        logger.info(f"System configuration successfully updated and activated: {cleaned}")

        # Dispatch notification to listeners
        for listener in list(self._listeners):
            try:
                listener(result)
            except Exception as e:
                logger.error(f"Error dispatching configuration update to listener: {e}")

        return result

    def reset_to_defaults(self) -> Dict[str, Any]:
        """Reset configuration back to factory baseline settings."""
        return self.update_configuration(dict(DEFAULT_CONFIGURATION))


# =============================================================================
# SINGLETON INSTANCE & MODULE-LEVEL ACCESSORS
# =============================================================================

_GLOBAL_CONFIG_SERVICE: Optional[ConfigurationService] = None
_GLOBAL_LOCK = threading.RLock()


def get_configuration_service(config_path: Optional[Path] = None) -> ConfigurationService:
    """Get or create the global singleton ConfigurationService."""
    global _GLOBAL_CONFIG_SERVICE
    with _GLOBAL_LOCK:
        if _GLOBAL_CONFIG_SERVICE is None:
            _GLOBAL_CONFIG_SERVICE = ConfigurationService(config_path=config_path)
        return _GLOBAL_CONFIG_SERVICE


def get_active_configuration() -> Dict[str, Any]:
    """Retrieve the current active configuration dictionary."""
    return get_configuration_service().get_configuration()
