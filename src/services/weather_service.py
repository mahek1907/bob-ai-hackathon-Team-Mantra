"""
GridSentinel AI — Open-Meteo Live Weather Service
Module: src/services/weather_service.py

Fetches real-time meteorological data from Open-Meteo REST API
with rate-limit protection, in-memory caching, and resilient
offline JSON fallback when connectivity is unavailable.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import requests

logger = logging.getLogger("grid_sentinel.weather_service")

DEFAULT_BASE_URL = "https://api.open-meteo.com"
DEFAULT_LATITUDE = 40.7128
DEFAULT_LONGITUDE = -74.0060
DEFAULT_CACHE_TTL = 120  # seconds

# WMO Weather interpretation codes (WW)
WMO_WEATHER_CODES: Dict[int, Dict[str, Any]] = {
    0: {"desc": "Clear Sky", "severity": 0.0, "is_storm": False},
    1: {"desc": "Mainly Clear", "severity": 0.5, "is_storm": False},
    2: {"desc": "Partly Cloudy", "severity": 1.0, "is_storm": False},
    3: {"desc": "Overcast", "severity": 2.0, "is_storm": False},
    45: {"desc": "Fog", "severity": 2.5, "is_storm": False},
    48: {"desc": "Depositing Rime Fog", "severity": 3.0, "is_storm": False},
    51: {"desc": "Light Drizzle", "severity": 2.0, "is_storm": False},
    53: {"desc": "Moderate Drizzle", "severity": 3.0, "is_storm": False},
    55: {"desc": "Dense Drizzle", "severity": 4.0, "is_storm": False},
    61: {"desc": "Slight Rain", "severity": 3.0, "is_storm": False},
    63: {"desc": "Moderate Rain", "severity": 4.5, "is_storm": False},
    65: {"desc": "Heavy Rain", "severity": 6.0, "is_storm": False},
    71: {"desc": "Slight Snow Fall", "severity": 4.0, "is_storm": False},
    73: {"desc": "Moderate Snow Fall", "severity": 5.5, "is_storm": False},
    75: {"desc": "Heavy Snow Fall", "severity": 7.0, "is_storm": False},
    80: {"desc": "Slight Rain Showers", "severity": 4.0, "is_storm": False},
    81: {"desc": "Moderate Rain Showers", "severity": 5.5, "is_storm": False},
    82: {"desc": "Violent Rain Showers", "severity": 7.5, "is_storm": False},
    95: {"desc": "Thunderstorm (Active Lightning)", "severity": 8.0, "is_storm": True},
    96: {"desc": "Thunderstorm with Slight Hail", "severity": 8.8, "is_storm": True},
    99: {"desc": "Severe Thunderstorm with Heavy Hail", "severity": 9.8, "is_storm": True},
}


class WeatherService:
    """Service managing live Open-Meteo weather ingestion and fallback cache."""

    def __init__(self, fallback_path: Optional[Path] = None):
        self.base_url = os.getenv("OPEN_METEO_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
        self.cache_ttl = int(os.getenv("WEATHER_CACHE_TTL_SECONDS", str(DEFAULT_CACHE_TTL)))
        self._cache: Dict[str, Any] = {}
        self._cache_timestamp: float = 0
        self._fallback_path = fallback_path or (Path(__file__).resolve().parent.parent / "data" / "weather_data.json")
        self._last_source = "INITIALIZING"

    def get_weather(
        self,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Retrieve current weather. Uses live Open-Meteo API when available,
        respects cache TTL, and falls back seamlessly to weather_data.json if unreachable.
        """
        now = time.time()
        lat = latitude if latitude is not None else DEFAULT_LATITUDE
        lon = longitude if longitude is not None else DEFAULT_LONGITUDE

        cache_key = f"{round(lat, 4)}:{round(lon, 4)}"

        if not force_refresh and self._cache.get(cache_key) and (now - self._cache_timestamp < self.cache_ttl):
            return self._cache[cache_key]

        try:
            live_data = self._fetch_open_meteo(lat, lon)
            if live_data:
                self._cache[cache_key] = live_data
                self._cache_timestamp = now
                self._last_source = "OPEN_METEO_LIVE"
                return live_data
        except Exception as e:
            logger.warning(f"Open-Meteo live API query failed ({e}); engaging offline fallback.")

        fallback = self._load_fallback(lat, lon)
        self._last_source = "OFFLINE_FALLBACK"
        return fallback

    def _fetch_open_meteo(self, lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """Execute actual HTTP request to Open-Meteo API."""
        endpoint = f"{self.base_url}/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_gusts_10m"
            ]
        }

        resp = requests.get(endpoint, params=params, timeout=5)
        if resp.status_code != 200:
            logger.warning(f"Open-Meteo returned status {resp.status_code}: {resp.text}")
            return None

        data = resp.json()
        current = data.get("current", {})
        if not current:
            return None

        temp = float(current.get("temperature_2m", 25.0))
        wind_gust = float(current.get("wind_gusts_10m", current.get("wind_speed_10m", 15.0)))
        wind_speed = float(current.get("wind_speed_10m", 12.0))
        humidity = float(current.get("relative_humidity_2m", 50.0))
        precip = float(current.get("precipitation", 0.0))
        pressure = float(current.get("surface_pressure", 1013.2))
        weather_code = int(current.get("weather_code", 0))

        code_info = WMO_WEATHER_CODES.get(weather_code, {"desc": "Moderate Conditions", "severity": 3.0, "is_storm": False})
        condition_name = code_info["desc"]
        is_thunderstorm = code_info["is_storm"]

        if is_thunderstorm:
            strikes = 45 if weather_code == 99 else (32 if weather_code == 96 else 18)
        else:
            strikes = 0

        base_sev = code_info["severity"]
        wind_sev = min(4.0, (wind_gust / 100.0) * 4.0)
        storm_severity = round(min(10.0, max(1.0, (base_sev * 0.6) + wind_sev)), 1)

        event_name = f"Live Open-Meteo: {condition_name}"
        if temp >= 35.0:
            event_name += " & Heatwave"

        return {
            "event_name": event_name,
            "ambient_temp_c": temp,
            "ambient_temperature": temp,
            "wind_speed_kmh": wind_gust,
            "wind_gust_speed": wind_gust,
            "sustained_wind_kmh": wind_speed,
            "humidity_pct": humidity,
            "relative_humidity_pct": humidity,
            "precipitation_mm": precip,
            "surface_pressure_hpa": pressure,
            "weather_code": weather_code,
            "weather_condition": condition_name,
            "lightning_strikes_last_hour": strikes,
            "lightning_activity": min(10.0, strikes / 5.0) if strikes > 0 else 0.0,
            "storm_severity_index": storm_severity,
            "storm_severity": "EXTREME" if storm_severity >= 8.0 else ("WARNING" if storm_severity >= 5.0 else ("WATCH" if storm_severity >= 3.0 else "NONE")),
            "heatwave_alert": temp >= 35.0,
            "source": "OPEN_METEO_LIVE",
            "timestamp": current.get("time") or datetime.now(timezone.utc).isoformat(),
            "latitude": lat,
            "longitude": lon,
            "is_offline_fallback": False,
            "is_live": True,
        }

    def _load_fallback(self, lat: float, lon: float) -> Dict[str, Any]:
        """Safely load offline fallback weather from static JSON."""
        if self._fallback_path.exists():
            try:
                with open(self._fallback_path, "r", encoding="utf-8") as f:
                    raw = json.load(f)
                    return {
                        "event_name": raw.get("event_name", "Offline Historical Storm Scenario"),
                        "ambient_temp_c": float(raw.get("ambient_temp_c", 39.4)),
                        "ambient_temperature": float(raw.get("ambient_temp_c", 39.4)),
                        "wind_speed_kmh": float(raw.get("wind_speed_kmh", 85.0)),
                        "wind_gust_speed": float(raw.get("wind_speed_kmh", 85.0)),
                        "sustained_wind_kmh": float(raw.get("wind_speed_kmh", 85.0) * 0.7),
                        "humidity_pct": 78.0,
                        "relative_humidity_pct": 78.0,
                        "precipitation_mm": 12.4,
                        "surface_pressure_hpa": 998.5,
                        "weather_code": 95,
                        "weather_condition": "Severe Tropical Storm (Offline Demo Profile)",
                        "lightning_strikes_last_hour": int(raw.get("lightning_strikes_last_hour", 42)),
                        "lightning_activity": min(10.0, float(raw.get("lightning_strikes_last_hour", 42)) / 5.0),
                        "storm_severity_index": float(raw.get("storm_severity_index", 8.5)),
                        "storm_severity": "EXTREME",
                        "heatwave_alert": bool(raw.get("heatwave_alert", True)),
                        "source": "OFFLINE_FALLBACK",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "latitude": lat,
                        "longitude": lon,
                        "is_offline_fallback": True,
                        "is_live": False,
                    }
            except Exception as e:
                logger.error(f"Failed to parse offline weather fallback file: {e}")

        return {
            "event_name": "Nominal Weather (Emergency Default)",
            "ambient_temp_c": 25.0,
            "ambient_temperature": 25.0,
            "wind_speed_kmh": 15.0,
            "wind_gust_speed": 18.0,
            "sustained_wind_kmh": 12.0,
            "humidity_pct": 50.0,
            "precipitation_mm": 0.0,
            "surface_pressure_hpa": 1013.25,
            "weather_code": 0,
            "weather_condition": "Clear Sky",
            "lightning_strikes_last_hour": 0,
            "lightning_activity": 0.0,
            "storm_severity_index": 1.0,
            "storm_severity": "NONE",
            "heatwave_alert": False,
            "source": "OFFLINE_DEFAULT",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": lat,
            "longitude": lon,
            "is_offline_fallback": True,
            "is_live": False,
        }

    def get_current_weather(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Convenience alias for get_weather()."""
        return self.get_weather(force_refresh=force_refresh)

    def get_substations_weather(self, substations: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """Fetch weather for each substation based on coordinates."""
        results: Dict[str, Dict[str, Any]] = {}
        for s in substations:
            sid = str(s.get("substation_id", "UNKNOWN"))
            lat = s.get("latitude")
            lon = s.get("longitude")
            results[sid] = self.get_weather(latitude=lat, longitude=lon)
        return results

    @property
    def last_source(self) -> str:
        return self._last_source

