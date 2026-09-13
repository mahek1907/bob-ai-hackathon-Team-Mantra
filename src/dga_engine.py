"""
GridSentinel AI — DGA & Physical Health Diagnostic Engine
Module: src/dga_engine.py
Owner: Person 1 (Khushi)

DISCLAIMER:
Simplified IEEE C57.104-inspired demo rules for hackathon demonstration only;
not certified protection, alarm, or maintenance settings. This prototype evaluates
simulated transformer sensor telemetry and does not replace certified electrical
engineering inspections or certified laboratory Dissolved Gas Analysis (DGA).
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple


# =============================================================================
# CENTRALIZED DEMO THRESHOLD CONSTANTS
# =============================================================================

# Dissolved Gas Concentrations in parts per million (ppm)
# Based on simplified IEEE C57.104 Condition 1 / 2 / 3 / 4 guidelines
ACETYLENE_ELEVATED_PPM: float = 2.0      # >2 ppm suggests possible electrical arcing
ACETYLENE_SEVERE_PPM: float = 15.0       # >15 ppm indicates high-energy electrical arcing
ETHYLENE_ELEVATED_PPM: float = 50.0      # >50 ppm suggests moderate-to-high thermal overheating
ETHYLENE_SEVERE_PPM: float = 150.0       # >150 ppm indicates severe thermal overheating
HYDROGEN_ELEVATED_PPM: float = 100.0     # >100 ppm suggests corona/partial discharge
HYDROGEN_SEVERE_PPM: float = 300.0       # >300 ppm indicates heavy partial discharge
METHANE_ELEVATED_PPM: float = 120.0      # >120 ppm suggests low-temperature thermal stress
METHANE_SEVERE_PPM: float = 400.0        # >400 ppm indicates significant low/med thermal stress
ETHANE_ELEVATED_PPM: float = 65.0        # >65 ppm suggests oil thermal degradation
ETHANE_SEVERE_PPM: float = 150.0         # >150 ppm indicates advancing thermal degradation

# Oil Temperature Thresholds (°C)
OIL_TEMP_NORMAL_MAX_C: float = 75.0      # Normal nominal operating range
OIL_TEMP_ELEVATED_C: float = 85.0        # >85°C suggests thermal loading stress
OIL_TEMP_SEVERE_C: float = 105.0         # >105°C indicates critical overheating risk
OIL_TEMP_MIN_PLAUSIBLE_C: float = -40.0  # Below this is sensor failure
OIL_TEMP_MAX_PLAUSIBLE_C: float = 180.0  # Above this is sensor failure

# Mechanical Core/Winding Vibration Thresholds (mm/s RMS)
VIBRATION_NORMAL_MAX_MMS: float = 2.5    # Normal nominal baseline
VIBRATION_ELEVATED_MMS: float = 3.5      # >3.5 mm/s suggests core/winding mechanical looseness
VIBRATION_SEVERE_MMS: float = 5.5        # >5.5 mm/s indicates severe mechanical stress
VIBRATION_MAX_PLAUSIBLE_MMS: float = 50.0  # Above this is sensor failure

# Maximum Sub-Score Allocations (Total = 100.0)
MAX_DGA_SCORE: float = 60.0              # Dissolved gas risk allocation (0-60)
MAX_OIL_TEMP_SCORE: float = 25.0         # Top oil temperature risk allocation (0-25)
MAX_VIBRATION_SCORE: float = 15.0        # Mechanical vibration risk allocation (0-15)

# Status Classifications
STATUS_NORMAL: str = "NORMAL"
STATUS_ADVISORY: str = "ADVISORY"
STATUS_WARNING: str = "WARNING"
STATUS_CRITICAL: str = "CRITICAL"

# Primary Fault Types
FAULT_NONE: str = "NONE"
FAULT_ARCING: str = "ARCING"
FAULT_THERMAL_OVERHEAT: str = "THERMAL_OVERHEAT"
FAULT_MECHANICAL_STRESS: str = "MECHANICAL_STRESS"
FAULT_DATA_QUALITY: str = "DATA_QUALITY"

# Sensor Quality Categories
QUALITY_GOOD: str = "GOOD"
QUALITY_DEGRADED: str = "DEGRADED"
QUALITY_INVALID: str = "INVALID"


# =============================================================================
# PRIVATE HELPER FUNCTIONS: NORMALIZATION & PARSING
# =============================================================================

def _parse_float(value: Any) -> Optional[float]:
    """
    Safely parse a numerical value to float.
    Returns None if value is missing, non-numeric, NaN, or infinite.
    """
    if value is None or isinstance(value, bool):
        return None
    try:
        val = float(value)
        if math.isnan(val) or math.isinf(val):
            return None
        return val
    except (ValueError, TypeError):
        return None


def _get_aliased_value(source: Dict[str, Any], aliases: List[str]) -> Tuple[Optional[float], Optional[str]]:
    """
    Look up a numeric value across a list of key aliases in a dictionary.
    Returns (parsed_value, matched_key). If key is present but value is invalid,
    returns (None, matched_key). If key is not present, returns (None, None).
    """
    for alias in aliases:
        if alias in source:
            raw_val = source[alias]
            parsed = _parse_float(raw_val)
            return parsed, alias
    return None, None


def _extract_dga_readings(
    asset: Dict[str, Any], flags: List[str]
) -> Tuple[Dict[str, Optional[float]], Dict[str, str], bool]:
    """
    Extract and normalize DGA gas readings (in ppm).
    Supports nested 'dga_ppm' dictionary as well as top-level flattened keys.
    Returns:
        - readings: Dict mapping gas name to numeric float (or None if absent/invalid)
        - gas_status: Dict mapping gas name to "valid", "missing", "invalid", or "negative"
        - any_present: bool indicating whether any gas telemetry field was supplied
    """
    dga_source: Dict[str, Any] = {}
    has_nested = "dga_ppm" in asset and isinstance(asset["dga_ppm"], dict)

    if has_nested:
        dga_source.update(asset["dga_ppm"])
    # Also permit top-level fallbacks if keys not in nested dict
    for k, v in asset.items():
        if k != "dga_ppm" and k not in dga_source:
            dga_source[k] = v

    gas_aliases = {
        "acetylene": ["acetylene", "c2h2", "c2h2_ppm", "C2H2", "Acetylene"],
        "ethylene": ["ethylene", "c2h4", "c2h4_ppm", "C2H4", "Ethylene"],
        "hydrogen": ["hydrogen", "h2", "h2_ppm", "H2", "Hydrogen"],
        "methane": ["methane", "ch4", "ch4_ppm", "CH4", "Methane"],
        "ethane": ["ethane", "c2h6", "c2h6_ppm", "C2H6", "Ethane"],
    }

    readings: Dict[str, Optional[float]] = {}
    gas_status: Dict[str, str] = {}
    any_present = False

    for gas_name, aliases in gas_aliases.items():
        val, matched_key = _get_aliased_value(dga_source, aliases)
        if matched_key is not None:
            any_present = True
            if val is None:
                flags.append(f"Invalid non-numeric value for {gas_name} in field '{matched_key}'")
                readings[gas_name] = None
                gas_status[gas_name] = "invalid"
            elif val < 0.0:
                flags.append(f"Negative {gas_name} reading ({val} ppm) is physically implausible")
                readings[gas_name] = None
                gas_status[gas_name] = "negative"
            else:
                readings[gas_name] = val
                gas_status[gas_name] = "valid"
        else:
            readings[gas_name] = None
            gas_status[gas_name] = "missing"

    return readings, gas_status, any_present


# =============================================================================
# PRIVATE HELPER FUNCTIONS: SUB-SCORE EVALUATORS
# =============================================================================

def _compute_dga_score(gases: Dict[str, Optional[float]], flags: List[str]) -> Tuple[float, Optional[str]]:
    """
    Calculate deterministic DGA risk sub-score (0.0 to 60.0).
    Emphasizes Acetylene (arcing, up to 35 pts) and Ethylene (overheating, up to 15 pts),
    with secondary contributions from Hydrogen, Methane, and Ethane (up to 10 pts).
    Returns (score, detected_dga_fault).
    """
    c2h2 = gases.get("acetylene")
    c2h4 = gases.get("ethylene")
    h2 = gases.get("hydrogen")
    ch4 = gases.get("methane")
    c2h6 = gases.get("ethane")

    detected_fault: Optional[str] = None
    c2h2_score = 0.0
    c2h4_score = 0.0
    secondary_score = 0.0

    # 1. Acetylene (C2H2) -- Arcing indicator (Max 50.0 pts in DGA)
    if c2h2 is not None:
        if c2h2 >= ACETYLENE_SEVERE_PPM:
            fraction = min(1.0, (c2h2 - ACETYLENE_SEVERE_PPM) / 15.0)
            c2h2_score = 45.0 + fraction * 5.0
            flags.append(f"High acetylene (C2H2: {c2h2:.1f} ppm) -- indicates severe electrical arcing risk")
            detected_fault = FAULT_ARCING
        elif c2h2 >= ACETYLENE_ELEVATED_PPM:
            fraction = (c2h2 - ACETYLENE_ELEVATED_PPM) / (ACETYLENE_SEVERE_PPM - ACETYLENE_ELEVATED_PPM)
            c2h2_score = 15.0 + fraction * 30.0
            flags.append(f"Elevated acetylene (C2H2: {c2h2:.1f} ppm) -- suggests possible electrical arcing")
            detected_fault = FAULT_ARCING

    # 2. Ethylene (C2H4) -- Thermal Overheating indicator (Max 25.0 pts in DGA)
    if c2h4 is not None:
        if c2h4 >= ETHYLENE_SEVERE_PPM:
            fraction = min(1.0, (c2h4 - ETHYLENE_SEVERE_PPM) / 150.0)
            c2h4_score = 20.0 + fraction * 5.0
            flags.append(f"High ethylene (C2H4: {c2h4:.1f} ppm) -- indicates severe thermal overheating")
            if detected_fault != FAULT_ARCING:
                detected_fault = FAULT_THERMAL_OVERHEAT
        elif c2h4 >= ETHYLENE_ELEVATED_PPM:
            fraction = (c2h4 - ETHYLENE_ELEVATED_PPM) / (ETHYLENE_SEVERE_PPM - ETHYLENE_ELEVATED_PPM)
            c2h4_score = 5.0 + fraction * 15.0
            flags.append(f"Elevated ethylene (C2H4: {c2h4:.1f} ppm) -- suggests possible thermal overheating")
            if detected_fault != FAULT_ARCING:
                detected_fault = FAULT_THERMAL_OVERHEAT

    # 3. Secondary Gases (H2, CH4, C2H6) (Max 10 pts total)
    if h2 is not None:
        if h2 >= HYDROGEN_SEVERE_PPM:
            secondary_score += 4.0
            flags.append(f"High hydrogen (H2: {h2:.1f} ppm) -- indicates partial discharge/corona activity")
        elif h2 >= HYDROGEN_ELEVATED_PPM:
            secondary_score += 2.0
            flags.append(f"Elevated hydrogen (H2: {h2:.1f} ppm) -- suggests possible partial discharge")

    if ch4 is not None:
        if ch4 >= METHANE_SEVERE_PPM:
            secondary_score += 3.0
            flags.append(f"High methane (CH4: {ch4:.1f} ppm) -- indicates low-temperature thermal oil breakdown")
        elif ch4 >= METHANE_ELEVATED_PPM:
            secondary_score += 1.5

    if c2h6 is not None:
        if c2h6 >= ETHANE_SEVERE_PPM:
            secondary_score += 3.0
            flags.append(f"High ethane (C2H6: {c2h6:.1f} ppm) -- indicates advanced oil thermal decomposition")
        elif c2h6 >= ETHANE_ELEVATED_PPM:
            secondary_score += 1.5

    secondary_score = min(10.0, secondary_score)
    total_dga = min(MAX_DGA_SCORE, c2h2_score + c2h4_score + secondary_score)
    return total_dga, detected_fault


def _compute_oil_temp_score(temp_c: Optional[float], flags: List[str]) -> Tuple[float, bool]:
    """
    Calculate deterministic oil temperature sub-score (0.0 to 25.0).
    Continuous interpolation across nominal, elevated, and severe thresholds.
    Returns (score, is_thermal_fault).
    """
    if temp_c is None:
        return 0.0, False

    if temp_c < OIL_TEMP_MIN_PLAUSIBLE_C or temp_c > OIL_TEMP_MAX_PLAUSIBLE_C:
        flags.append(f"Oil temperature ({temp_c:.1f} C) is outside plausible physical range")
        return 0.0, False

    if temp_c <= OIL_TEMP_NORMAL_MAX_C:
        return 0.0, False
    elif temp_c <= OIL_TEMP_ELEVATED_C:
        # Smooth warming between 75 C and 85 C (0.0 to 6.0 pts)
        fraction = (temp_c - OIL_TEMP_NORMAL_MAX_C) / (OIL_TEMP_ELEVATED_C - OIL_TEMP_NORMAL_MAX_C)
        return fraction * 6.0, False
    elif temp_c <= OIL_TEMP_SEVERE_C:
        # Elevated thermal stress between 85 C and 105 C (6.0 to 20.0 pts)
        fraction = (temp_c - OIL_TEMP_ELEVATED_C) / (OIL_TEMP_SEVERE_C - OIL_TEMP_ELEVATED_C)
        flags.append(f"Elevated oil temperature ({temp_c:.1f} C) -- suggests thermal loading stress")
        return 6.0 + fraction * 14.0, True
    else:
        # Severe overheating > 105 C (20.0 to 25.0 pts max)
        fraction = min(1.0, (temp_c - OIL_TEMP_SEVERE_C) / 20.0)
        flags.append(f"High oil temperature ({temp_c:.1f} C) -- indicates critical overheating stress")
        return 20.0 + fraction * 5.0, True


def _compute_vibration_score(vib_mms: Optional[float], flags: List[str]) -> Tuple[float, bool]:
    """
    Calculate deterministic vibration sub-score (0.0 to 15.0).
    Continuous interpolation across nominal, elevated, and severe thresholds.
    Returns (score, is_mechanical_fault).
    """
    if vib_mms is None:
        return 0.0, False

    if vib_mms < 0.0 or vib_mms > VIBRATION_MAX_PLAUSIBLE_MMS:
        flags.append(f"Vibration level ({vib_mms:.1f} mm/s) is outside plausible physical range")
        return 0.0, False

    if vib_mms <= VIBRATION_NORMAL_MAX_MMS:
        return 0.0, False
    elif vib_mms <= VIBRATION_ELEVATED_MMS:
        # Moderate vibration between 2.5 and 3.5 mm/s (0.0 to 4.0 pts)
        fraction = (vib_mms - VIBRATION_NORMAL_MAX_MMS) / (VIBRATION_ELEVATED_MMS - VIBRATION_NORMAL_MAX_MMS)
        return fraction * 4.0, False
    elif vib_mms <= VIBRATION_SEVERE_MMS:
        # Elevated vibration between 3.5 and 5.5 mm/s (4.0 to 11.0 pts)
        fraction = (vib_mms - VIBRATION_ELEVATED_MMS) / (VIBRATION_SEVERE_MMS - VIBRATION_ELEVATED_MMS)
        flags.append(f"Elevated vibration ({vib_mms:.2f} mm/s) -- suggests mechanical/core stress")
        return 4.0 + fraction * 7.0, True
    else:
        # Severe vibration > 5.5 mm/s (11.0 to 15.0 pts max)
        fraction = min(1.0, (vib_mms - VIBRATION_SEVERE_MMS) / 2.0)
        flags.append(f"High vibration ({vib_mms:.2f} mm/s) -- indicates significant mechanical stress")
        return 11.0 + fraction * 4.0, True


# =============================================================================
# PUBLIC INTERFACE
# =============================================================================

def evaluate_dga_and_health(asset: dict) -> dict:
    """
    Evaluate transformer physical health and DGA condition deterministically.

    Parameters:
        asset (dict): Transformer telemetry record containing:
            - asset_id (str)
            - substation_id (str, optional)
            - dga_ppm (dict of gas concentrations in ppm: hydrogen, methane, ethane,
              ethylene, acetylene)
            - oil_temperature (float, °C)
            - vibration_level (float, mm/s)
            - electrical_load_pct (float, optional)
            - previous_fault_history (int, optional)

    Returns:
        dict: Standardized diagnostic result:
            - asset_id (str)
            - substation_id (str or None)
            - physical_health_score (float, 0.0 to 100.0)
            - fault_flags (list of str)
            - dga_status (str: "NORMAL", "ADVISORY", "WARNING", "CRITICAL")
            - primary_fault_type (str: "NONE", "ARCING", "THERMAL_OVERHEAT",
              "MECHANICAL_STRESS", "DATA_QUALITY")
            - sensor_quality (str: "GOOD", "DEGRADED", "INVALID")
    """
    fault_flags: List[str] = []

    # 1. Validate root input type
    if not isinstance(asset, dict):
        return {
            "asset_id": "UNKNOWN",
            "substation_id": None,
            "physical_health_score": 50.0,
            "fault_flags": ["Input asset record is invalid or not a dictionary"],
            "dga_status": STATUS_WARNING,
            "primary_fault_type": FAULT_DATA_QUALITY,
            "sensor_quality": QUALITY_INVALID,
        }

    # 2. Extract asset identification
    asset_id_val = asset.get("asset_id") or asset.get("id") or asset.get("transformer_id")
    if not asset_id_val or not str(asset_id_val).strip():
        asset_id = "UNKNOWN_ASSET"
        fault_flags.append("Missing or empty asset_id identifier")
    else:
        asset_id = str(asset_id_val).strip()

    substation_id_val = asset.get("substation_id") or asset.get("substation")
    substation_id = str(substation_id_val).strip() if substation_id_val else None

    # 3. Extract and normalize sensor telemetry
    gases, gas_status, dga_present = _extract_dga_readings(asset, fault_flags)

    # Temperature aliases
    temp_aliases = ["oil_temperature", "oil_temp", "oil_temperature_c", "oil_temp_c"]
    temp_val, temp_key = _get_aliased_value(asset, temp_aliases)
    if temp_key is not None and temp_val is None:
        fault_flags.append(f"Invalid non-numeric oil temperature in field '{temp_key}'")

    # Vibration aliases
    vib_aliases = ["vibration_level", "vibration", "vibration_mm_s", "vibration_mms"]
    vib_val, vib_key = _get_aliased_value(asset, vib_aliases)
    if vib_key is not None and vib_val is None:
        fault_flags.append(f"Invalid non-numeric vibration reading in field '{vib_key}'")

    # 4. Assess sensor quality and missing critical data
    quality_issues = 0

    if not dga_present:
        fault_flags.append("Missing dissolved gas analysis telemetry (dga_ppm)")
        quality_issues += 3
    else:
        # Check critical fault gases using status to avoid duplicate flags
        if gas_status.get("acetylene") == "missing":
            fault_flags.append("Missing acetylene (C2H2) reading")
            quality_issues += 1
        elif gas_status.get("acetylene") in ("invalid", "negative"):
            quality_issues += 1

        if gas_status.get("ethylene") == "missing":
            fault_flags.append("Missing ethylene (C2H4) reading")
            quality_issues += 1
        elif gas_status.get("ethylene") in ("invalid", "negative"):
            quality_issues += 1

    if temp_key is None:
        fault_flags.append("Missing oil temperature telemetry")
        quality_issues += 1
    elif temp_val is None:
        quality_issues += 1

    if vib_key is None:
        fault_flags.append("Missing vibration telemetry")
        quality_issues += 1
    elif vib_val is None:
        quality_issues += 1

    # Classify sensor quality
    if quality_issues == 0:
        sensor_quality = QUALITY_GOOD
    elif quality_issues <= 2:
        sensor_quality = QUALITY_DEGRADED
    else:
        sensor_quality = QUALITY_INVALID

    # 5. Compute sub-scores
    dga_subscore, dga_fault = _compute_dga_score(gases, fault_flags)
    temp_subscore, is_temp_fault = _compute_oil_temp_score(temp_val, fault_flags)
    vib_subscore, is_vib_fault = _compute_vibration_score(vib_val, fault_flags)

    # Uncertainty penalty for missing data (ensures unmonitored units do not score 0)
    data_quality_penalty = 0.0
    if sensor_quality == QUALITY_INVALID:
        data_quality_penalty = 25.0
    elif sensor_quality == QUALITY_DEGRADED:
        data_quality_penalty = min(12.0, quality_issues * 4.0)

    # 6. Synthesize composite physical health score (bounded 0.0 to 100.0)
    total_score = dga_subscore + temp_subscore + vib_subscore + data_quality_penalty
    physical_health_score = round(max(0.0, min(100.0, total_score)), 1)

    # 7. Determine overall DGA status
    if physical_health_score >= 70.0:
        dga_status = STATUS_CRITICAL
    elif physical_health_score >= 40.0:
        dga_status = STATUS_WARNING
    elif physical_health_score >= 20.0:
        dga_status = STATUS_ADVISORY
    else:
        dga_status = STATUS_NORMAL

    # 8. Determine primary fault type (strict deterministic precedence)
    # Precedence: ARCING -> THERMAL_OVERHEAT -> MECHANICAL_STRESS -> DATA_QUALITY -> NONE
    if dga_fault == FAULT_ARCING:
        primary_fault_type = FAULT_ARCING
    elif dga_fault == FAULT_THERMAL_OVERHEAT or is_temp_fault:
        primary_fault_type = FAULT_THERMAL_OVERHEAT
    elif is_vib_fault:
        primary_fault_type = FAULT_MECHANICAL_STRESS
    elif sensor_quality in (QUALITY_INVALID, QUALITY_DEGRADED):
        primary_fault_type = FAULT_DATA_QUALITY
    else:
        primary_fault_type = FAULT_NONE

    return {
        "asset_id": asset_id,
        "substation_id": substation_id,
        "physical_health_score": physical_health_score,
        "fault_flags": fault_flags,
        "dga_status": dga_status,
        "primary_fault_type": primary_fault_type,
        "sensor_quality": sensor_quality,
    }
