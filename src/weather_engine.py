"""
GridSentinel AI — Dynamic Weather Risk Severity Engine
Module: src/weather_engine.py
Owner: Person 1 (Khushi)

DISCLAIMER:
Simplified rule-based environmental risk logic for hackathon demonstration only.
It is not certified grid protection, official meteorological forecasting, or utility
operational control logic. This module evaluates environmental stress multipliers
from simulated weather conditions and transformer oil temperature context.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple


# =============================================================================
# CENTRALIZED WEATHER THRESHOLD CONSTANTS
# =============================================================================

# Ambient Temperature Thresholds (°C)
AMBIENT_HIGH_C: float = 35.0          # Elevated temperature increases cooling burden
AMBIENT_SEVERE_C: float = 42.0        # Extreme heatwave ambient temperature
AMBIENT_MIN_PLAUSIBLE_C: float = -50.0
AMBIENT_MAX_PLAUSIBLE_C: float = 65.0

# Wind Gust Speed Thresholds (km/h)
WIND_ELEVATED_KMH: float = 50.0       # 50-75 km/h: line oscillation, tree exposure
WIND_HIGH_KMH: float = 75.0           # 75-100 km/h: severe structural exposure
WIND_SEVERE_KMH: float = 100.0        # >100 km/h: storm/gale force mechanical hazard
WIND_MAX_PLAUSIBLE_KMH: float = 300.0

# Lightning Activity Thresholds (Index 0-10 or normalized from strikes/hr)
LIGHTNING_MODERATE_INDEX: float = 3.0 # Moderate transient electrical activity
LIGHTNING_HIGH_INDEX: float = 6.0     # Elevated lightning strike risk
LIGHTNING_SEVERE_INDEX: float = 9.0   # Severe lightning activity in sector

# Contextual Oil Temperature Thresholds (°C) for Thermal Interaction
OIL_TEMP_ELEVATED_C: float = 85.0     # Elevated oil temp reduces cooling headroom
OIL_TEMP_SEVERE_C: float = 105.0      # Critical oil temp under environmental heat

# Multiplier Increments (Additive Contributions)
HEAT_HIGH_MULT: float = 0.05
HEAT_SEVERE_MULT: float = 0.10
HEATWAVE_ALERT_MULT: float = 0.05

WIND_ELEVATED_MULT: float = 0.04
WIND_HIGH_MULT: float = 0.08
WIND_SEVERE_MULT: float = 0.12

LIGHTNING_MODERATE_MULT: float = 0.04
LIGHTNING_HIGH_MULT: float = 0.08
LIGHTNING_SEVERE_MULT: float = 0.12

STORM_WATCH_MULT: float = 0.04
STORM_WARNING_MULT: float = 0.08
STORM_EXTREME_MULT: float = 0.12

INTERACTION_ELEVATED_MULT: float = 0.05
INTERACTION_SEVERE_MULT: float = 0.08

# Bounded Multiplier Limits
WEATHER_MULTIPLIER_BASE: float = 1.0
WEATHER_MULTIPLIER_MIN: float = 1.0
WEATHER_MULTIPLIER_MAX: float = 1.5


# =============================================================================
# PRIVATE HELPER FUNCTIONS: PARSING & VALIDATION
# =============================================================================

def _parse_float(val: Any) -> Optional[float]:
    """
    Safely parse numeric value to float.
    Returns None if value is None, bool, non-numeric string, NaN, or infinite.
    """
    if val is None or isinstance(val, bool):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _parse_bool(val: Any) -> bool:
    """Safely parse boolean flag from bool, string, or integer."""
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val != 0
    if isinstance(val, str):
        return val.strip().lower() in ("true", "1", "yes", "t")
    return False


def _normalize_lightning(raw_lightning: Any) -> Optional[float]:
    """
    Normalize lightning activity into a bounded index from 0.0 to 10.0.

    Demo Assumption:
    In synthetic telemetry, lightning may be supplied either as a normalized
    severity index (0.0 to 10.0) or as an hourly strike count.
    Values between 0.0 and 10.0 directly represent the 0-10 severity index.
    Values > 10.0 (such as high strike counts) saturate at the maximum
    severity index of 10.0. This guarantees strict monotonicity where higher
    lightning activity never produces a lower risk multiplier.
    """
    parsed = _parse_float(raw_lightning)
    if parsed is None or parsed < 0.0:
        return None
    return min(10.0, parsed)


# =============================================================================
# PRIVATE HELPER FUNCTIONS: HAZARD EVALUATORS
# =============================================================================

def _eval_heat_hazard(
    ambient_temp: Optional[float], heatwave_alert: bool, alerts: List[str]
) -> Tuple[float, bool]:
    """
    Evaluate heatwave and ambient temperature contribution.
    Returns (heat_multiplier_increment, has_environmental_heat).
    """
    contrib = 0.0
    has_env_heat = False

    if ambient_temp is not None:
        if AMBIENT_MIN_PLAUSIBLE_C <= ambient_temp <= AMBIENT_MAX_PLAUSIBLE_C:
            if ambient_temp >= AMBIENT_SEVERE_C:
                contrib += HEAT_SEVERE_MULT
                has_env_heat = True
                alerts.append(f"Severe ambient temperature ({ambient_temp:.1f} C) substantially elevates cooling stress")
            elif ambient_temp >= AMBIENT_HIGH_C:
                contrib += HEAT_HIGH_MULT
                has_env_heat = True
                alerts.append(f"High ambient temperature ({ambient_temp:.1f} C) increases cooling burden")

    if heatwave_alert:
        contrib += HEATWAVE_ALERT_MULT
        has_env_heat = True
        alerts.append("Heatwave conditions may increase transformer thermal stress")

    return contrib, has_env_heat


def _eval_wind_hazard(wind_gust_kmh: Optional[float], alerts: List[str]) -> float:
    """Evaluate wind gust speed hazard contribution."""
    if wind_gust_kmh is None or wind_gust_kmh < 0.0:
        return 0.0

    if wind_gust_kmh > WIND_MAX_PLAUSIBLE_KMH:
        alerts.append(f"Reported wind speed ({wind_gust_kmh:.1f} km/h) exceeds plausible range; ignored")
        return 0.0

    if wind_gust_kmh >= WIND_SEVERE_KMH:
        alerts.append(f"Severe wind gusts ({wind_gust_kmh:.1f} km/h) - structural and grid infrastructure hazard")
        return WIND_SEVERE_MULT
    elif wind_gust_kmh >= WIND_HIGH_KMH:
        alerts.append(f"High wind gusts ({wind_gust_kmh:.1f} km/h) - elevated tree and line contact risk")
        return WIND_HIGH_MULT
    elif wind_gust_kmh >= WIND_ELEVATED_KMH:
        alerts.append(f"Elevated wind gusts ({wind_gust_kmh:.1f} km/h) - minor distribution stress")
        return WIND_ELEVATED_MULT

    return 0.0


def _eval_lightning_hazard(lightning_index: Optional[float], alerts: List[str]) -> float:
    """Evaluate lightning activity hazard contribution."""
    if lightning_index is None or lightning_index <= 0.0:
        return 0.0

    if lightning_index >= LIGHTNING_SEVERE_INDEX:
        alerts.append("Severe lightning activity - high risk of grid electrical surges")
        return LIGHTNING_SEVERE_MULT
    elif lightning_index >= LIGHTNING_HIGH_INDEX:
        alerts.append("Elevated lightning activity increases electrical disturbance risk")
        return LIGHTNING_HIGH_MULT
    elif lightning_index >= LIGHTNING_MODERATE_INDEX:
        alerts.append("Moderate lightning activity - potential transient electrical disturbances")
        return LIGHTNING_MODERATE_MULT

    return 0.0


def _eval_storm_severity(storm_severity_raw: Any, alerts: List[str]) -> float:
    """Evaluate categorical storm severity rating."""
    if not isinstance(storm_severity_raw, str):
        return 0.0

    severity = storm_severity_raw.strip().upper()

    if severity == "EXTREME":
        alerts.append("Extreme storm alert - severe multi-hazard meteorological event")
        return STORM_EXTREME_MULT
    elif severity == "WARNING":
        alerts.append("Severe storm warning active in substation sector")
        return STORM_WARNING_MULT
    elif severity == "WATCH":
        alerts.append("Storm watch active - potential adverse weather development")
        return STORM_WATCH_MULT

    return 0.0


def _eval_thermal_interaction(
    asset_oil_temp: Optional[float], has_env_heat: bool, alerts: List[str]
) -> float:
    """
    Evaluate interaction between elevated transformer oil temperature and environmental heat.
    Ensures separation: physical oil risk is owned by DGA engine; weather engine accounts
    only for the compromised heat dissipation when high ambient heat coincides with high oil temp.
    """
    if asset_oil_temp is None or not has_env_heat:
        return 0.0

    # Ignore physically implausible oil temperatures in interaction calculations
    if asset_oil_temp < -40.0 or asset_oil_temp > 180.0:
        return 0.0

    if asset_oil_temp >= OIL_TEMP_SEVERE_C:
        alerts.append(
            f"Critical transformer oil temperature ({asset_oil_temp:.1f} C) under extreme ambient heat - severe cooling barrier"
        )
        return INTERACTION_SEVERE_MULT
    elif asset_oil_temp >= OIL_TEMP_ELEVATED_C:
        alerts.append(
            f"Elevated transformer oil temperature ({asset_oil_temp:.1f} C) under heatwave conditions compromises cooling efficiency"
        )
        return INTERACTION_ELEVATED_MULT

    return 0.0


# =============================================================================
# PUBLIC INTERFACE
# =============================================================================

def calculate_weather_factor(
    asset_oil_temp: float,
    weather: dict,
) -> dict:
    """
    Calculate dynamic weather stress multiplier and diagnostic alerts.

    Parameters:
        asset_oil_temp (float): Current transformer top oil temperature (°C).
            Runtime handles float, int, numeric string, None, or malformed inputs safely.
        weather (dict): Meteorological telemetry dictionary containing:
            - ambient_temperature (float, °C)
            - wind_gust_speed (float, km/h)
            - lightning_activity (float/int, index 0-10 or strikes/hr)
            - storm_severity (str: "NONE", "WATCH", "WARNING", "EXTREME")
            - heatwave_alert (bool)
            - substation_id (str, optional)

    Returns:
        dict: Standardized weather evaluation result:
            - weather_multiplier (float, bounded strictly in [1.0, 1.5], rounded to 2 decimals)
            - weather_alerts (list of str, human-readable explanatory warnings, empty if calm)
    """
    weather_alerts: List[str] = []

    # 1. Validate weather root dictionary
    if not isinstance(weather, dict):
        return {
            "weather_multiplier": WEATHER_MULTIPLIER_BASE,
            "weather_alerts": ["Weather telemetry is unavailable or not a dictionary"],
        }

    # 2. Parse transformer oil temperature safely (runtime guard against bad inputs)
    oil_temp_parsed = _parse_float(asset_oil_temp)

    # 3. Extract and parse weather telemetry
    ambient_temp = _parse_float(weather.get("ambient_temperature"))
    wind_gust = _parse_float(weather.get("wind_gust_speed"))
    lightning_norm = _normalize_lightning(weather.get("lightning_activity"))
    heatwave_flag = _parse_bool(weather.get("heatwave_alert"))
    storm_severity = weather.get("storm_severity")

    # 4. Evaluate individual hazard increments
    heat_inc, has_env_heat = _eval_heat_hazard(ambient_temp, heatwave_flag, weather_alerts)
    wind_inc = _eval_wind_hazard(wind_gust, weather_alerts)
    lightning_inc = _eval_lightning_hazard(lightning_norm, weather_alerts)
    storm_inc = _eval_storm_severity(storm_severity, weather_alerts)
    interaction_inc = _eval_thermal_interaction(oil_temp_parsed, has_env_heat, weather_alerts)

    # 5. Synthesize composite multiplier (bounded strictly in [1.0, 1.5])
    raw_multiplier = (
        WEATHER_MULTIPLIER_BASE
        + heat_inc
        + wind_inc
        + lightning_inc
        + storm_inc
        + interaction_inc
    )

    clamped_multiplier = max(
        WEATHER_MULTIPLIER_MIN,
        min(WEATHER_MULTIPLIER_MAX, raw_multiplier),
    )

    # Deduplicate alerts while preserving insertion order
    unique_alerts = list(dict.fromkeys(weather_alerts))

    return {
        "weather_multiplier": round(clamped_multiplier, 2),
        "weather_alerts": unique_alerts,
    }
