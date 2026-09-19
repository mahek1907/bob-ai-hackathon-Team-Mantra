"""
GridSentinel AI — Comprehensive Outage Risk & Equipment Failure Prioritization Engine
Module: src/risk_engine.py
Owner: Person 1 (Khushi)

DISCLAIMER:
Simplified deterministic risk heuristic for hackathon demonstration only;
not certified grid protection, utility reliability index, or operational-control
decision logic. This engine synthesizes physical equipment diagnostics, environmental
weather stress, and topological grid criticality into an explainable composite risk ranking.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

try:
    from .dga_engine import evaluate_dga_and_health
    from .weather_engine import calculate_weather_factor
except ImportError:
    from dga_engine import evaluate_dga_and_health  # type: ignore
    from weather_engine import calculate_weather_factor  # type: ignore


# =============================================================================
# CENTRALIZED RISK HEURISTIC CONSTANTS
# =============================================================================

# Composite Formula Component Weightings (Sum = 1.00)
PHYSICAL_WEIGHT: float = 0.60         # 60% weight on transformer physical health
WEATHER_WEIGHT: float = 0.20          # 20% weight on environmental weather stress
CRITICALITY_WEIGHT: float = 0.20      # 20% weight on grid & societal criticality

# Default Neutral Baseline for Missing Criticality Data
CRITICALITY_DEFAULT: float = 50.0

# Risk Category Classification Thresholds (Composite Score 0–100)
RISK_THRESHOLD_LOW_MAX: float = 30.0     # 0.0 <= score < 30.0 -> LOW
RISK_THRESHOLD_MEDIUM_MAX: float = 60.0  # 30.0 <= score < 60.0 -> MEDIUM
RISK_THRESHOLD_HIGH_MAX: float = 80.0    # 60.0 <= score < 80.0 -> HIGH
# 80.0 <= score <= 100.0 -> CRITICAL

CATEGORY_LOW: str = "LOW"
CATEGORY_MEDIUM: str = "MEDIUM"
CATEGORY_HIGH: str = "HIGH"
CATEGORY_CRITICAL: str = "CRITICAL"

# Suggested Action Prescriptions (Human-in-the-loop Recommendations)
ACTION_LOW: str = "Continue routine monitoring."
ACTION_MEDIUM: str = "Increase monitoring frequency and review emerging risk factors."
ACTION_HIGH: str = "Schedule priority inspection and prepare contingency actions."
ACTION_CRITICAL: str = "Initiate immediate engineering review and contingency planning."


# =============================================================================
# PRIVATE HELPER FUNCTIONS: PARSING & ADAPTERS
# =============================================================================

def _parse_float(val: Any) -> Optional[float]:
    """Safely parse float value, rejecting None, bool, non-numeric, NaN, and Inf."""
    if val is None or isinstance(val, bool):
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def _find_substation_record(substation_id: Optional[str], substations: Any) -> Optional[Dict[str, Any]]:
    """
    Locate substation metadata record from supplied substations collection.
    Accepts list of dicts, dict keyed by substation_id, or single dict.
    """
    if not substation_id or not substations:
        return None

    target_id = str(substation_id).strip().upper()

    if isinstance(substations, list):
        for rec in substations:
            if isinstance(rec, dict):
                sid = rec.get("substation_id") or rec.get("id") or rec.get("substation")
                if sid and str(sid).strip().upper() == target_id:
                    return rec
    elif isinstance(substations, dict):
        # Case 1: Dict keyed directly by substation_id
        if target_id in substations and isinstance(substations[target_id], dict):
            return substations[target_id]
        for k, v in substations.items():
            if str(k).strip().upper() == target_id and isinstance(v, dict):
                return v
            if isinstance(v, dict):
                sid = v.get("substation_id") or v.get("id") or v.get("substation")
                if sid and str(sid).strip().upper() == target_id:
                    return v
        # Case 2: Substation records nested inside 'substations' or 'records'
        for nested_key in ("substations", "records", "data"):
            nested_list = substations.get(nested_key)
            if isinstance(nested_list, list):
                res = _find_substation_record(substation_id, nested_list)
                if res:
                    return res

    return None


def _extract_criticality_score(
    substation_id: Optional[str], substations: Any
) -> Tuple[float, bool]:
    """
    Extract pre-computed grid criticality score from substation record.
    Supports aliases: criticality_score, grid_criticality_score, substation_criticality_score.
    Returns (clamped_criticality_score, is_measured_flag).
    If missing or invalid, returns (CRITICALITY_DEFAULT, False).
    """
    sub_rec = _find_substation_record(substation_id, substations)
    if sub_rec is None:
        return CRITICALITY_DEFAULT, False

    aliases = [
        "criticality_score",
        "grid_criticality_score",
        "substation_criticality_score",
        "criticality",
        "criticality_index",
    ]
    for alias in aliases:
        if alias in sub_rec:
            val = _parse_float(sub_rec[alias])
            if val is not None:
                clamped = max(0.0, min(100.0, val))
                return clamped, True

    return CRITICALITY_DEFAULT, False


def _find_weather_record(substation_id: Optional[str], weather_input: Any) -> Tuple[Dict[str, Any], bool]:
    """
    Locate matching weather telemetry dictionary for a substation.
    Returns (weather_dict, is_matched_flag).
    """
    if not isinstance(weather_input, (dict, list)) or not weather_input:
        return {}, False

    target_id = str(substation_id).strip().upper() if substation_id else None

    # Scenario A: weather_input is a single weather dictionary
    if isinstance(weather_input, dict):
        # Check if it has a specific substation_id field
        w_sub = weather_input.get("substation_id") or weather_input.get("substation") or weather_input.get("region_id")
        if w_sub:
            if target_id and str(w_sub).strip().upper() == target_id:
                return weather_input, True
        else:
            # General/regional weather dictionary without specific substation key
            return weather_input, True

        # Check if weather_input contains a list of regional records
        for nested_key in ("weather", "records", "substations", "data"):
            nested = weather_input.get(nested_key)
            if isinstance(nested, list):
                res, matched = _find_weather_record(substation_id, nested)
                if matched:
                    return res, True

    # Scenario B: weather_input is a list of weather dictionaries
    if isinstance(weather_input, list):
        for rec in weather_input:
            if isinstance(rec, dict):
                sid = rec.get("substation_id") or rec.get("substation") or rec.get("region_id")
                if sid and target_id and str(sid).strip().upper() == target_id:
                    return rec, True

        # Fallback to first dict in list if no ID matches
        for rec in weather_input:
            if isinstance(rec, dict):
                return rec, False

    return {}, False


def _extract_oil_temp(asset: Dict[str, Any]) -> Optional[float]:
    """Extract and parse oil temperature from asset record across common aliases."""
    temp_aliases = ["oil_temperature", "oil_temp", "oil_temperature_c", "oil_temp_c"]
    for alias in temp_aliases:
        if alias in asset:
            parsed = _parse_float(asset[alias])
            if parsed is not None:
                return parsed
    return None


def _build_telemetry_snapshot(asset: Any) -> Dict[str, Any]:
    """
    Safely extract snapshot of relevant raw asset telemetry for UI visualization.
    Does not mutate the original asset record.
    """
    if not isinstance(asset, dict):
        return {}

    snapshot_keys = [
        "asset_id",
        "substation_id",
        "dga_ppm",
        "oil_temperature",
        "vibration_level",
        "electrical_load_pct",
        "previous_fault_history",
        "rated_mva",
        "voltage_kv",
        "installation_year",
    ]
    snapshot: Dict[str, Any] = {}
    for k in snapshot_keys:
        if k in asset:
            snapshot[k] = asset[k]

    return snapshot


def _classify_risk_category(score: float) -> str:
    """Map composite risk score (0-100) to deterministic risk category."""
    if score >= RISK_THRESHOLD_HIGH_MAX:
        return CATEGORY_CRITICAL
    elif score >= RISK_THRESHOLD_MEDIUM_MAX:
        return CATEGORY_HIGH
    elif score >= RISK_THRESHOLD_LOW_MAX:
        return CATEGORY_MEDIUM
    return CATEGORY_LOW


def _prescribe_action(category: str) -> str:
    """Assign deterministic operational guidance based on risk category."""
    if category == CATEGORY_CRITICAL:
        return ACTION_CRITICAL
    elif category == CATEGORY_HIGH:
        return ACTION_HIGH
    elif category == CATEGORY_MEDIUM:
        return ACTION_MEDIUM
    return ACTION_LOW


# =============================================================================
# PUBLIC INTERFACE
# =============================================================================

def calculate_comprehensive_risk(
    assets: list,
    weather: dict,
    substations: list,
    config: Optional[Dict[str, Any]] = None,
) -> list:
    """
    Calculate comprehensive outage risk and produce a ranked failure-advisory list.

    Combines:
    1. Physical equipment health from src.dga_engine (IEEE C57.104 DGA, oil temp, vibration)
    2. Environmental weather stress multiplier from src.weather_engine
    3. Grid and societal criticality from substation infrastructure records

    Parameters:
        assets (list): Collection of transformer asset telemetry dictionaries.
        weather (dict): Meteorological telemetry (single dict or substation-keyed collection).
        substations (list): Substation operational records with pre-computed criticality.
        config (dict, optional): Workstation diagnostic threshold overrides.

    Returns:
        list: Ranked list of risk dictionaries sorted descending by composite_risk_score,
            physical_health_score, and asset_id.
    """
    if not isinstance(assets, list) or not assets:
        return []

    ranked_results: List[Dict[str, Any]] = []

    for raw_asset in assets:
        # 1. Evaluate Physical DGA & Equipment Health
        dga_res = evaluate_dga_and_health(raw_asset, config=config)

        asset_id = dga_res["asset_id"]
        substation_id = dga_res["substation_id"] or "UNKNOWN_SUBSTATION"
        physical_health_score = dga_res["physical_health_score"]
        dga_status = dga_res["dga_status"]
        primary_fault_type = dga_res["primary_fault_type"]
        dga_fault_flags = dga_res["fault_flags"]

        # Note: dga_health_index maintains the same 0-100 physical risk-oriented
        # metric (higher = worse condition) expected by downstream components.
        dga_health_index = physical_health_score

        # 2. Evaluate Contextual Weather Multiplier
        oil_temp = _extract_oil_temp(raw_asset) if isinstance(raw_asset, dict) else None
        substation_weather, has_weather_match = _find_weather_record(substation_id, weather)

        weather_res = calculate_weather_factor(oil_temp, substation_weather)
        weather_multiplier = weather_res["weather_multiplier"]
        weather_alerts = weather_res["weather_alerts"]

        # 3. Extract Grid Criticality Score
        crit_score, has_crit_measured = _extract_criticality_score(substation_id, substations)

        # 4. Calculate Normalized Risk Components
        # weather_multiplier is strictly bounded in [1.0, 1.5]
        # Normalize weather contribution to 0.0 - 100.0 scale
        weather_risk_normalized = ((weather_multiplier - 1.0) / 0.5) * 100.0

        # 5. Synthesize Composite Risk Score (Weighted Linear Heuristic)
        composite_raw = (
            PHYSICAL_WEIGHT * physical_health_score
            + WEATHER_WEIGHT * weather_risk_normalized
            + CRITICALITY_WEIGHT * crit_score
        )
        composite_risk_score = round(max(0.0, min(100.0, composite_raw)), 1)

        # 6. Classify Risk Category & Suggested Action
        risk_category = _classify_risk_category(composite_risk_score)
        suggested_action = _prescribe_action(risk_category)

        # 7. Synthesize Deduplicated Risk Factors
        risk_factors: List[str] = []

        # DGA & Physical Evidence
        risk_factors.extend(dga_fault_flags)
        if physical_health_score >= 70.0:
            risk_factors.append(f"Critical physical equipment degradation (health index: {physical_health_score:.1f})")
        elif physical_health_score >= 40.0:
            risk_factors.append(f"Elevated physical equipment risk (health index: {physical_health_score:.1f})")

        # Weather Evidence
        if not has_weather_match:
            risk_factors.append("Weather telemetry unavailable for asset location")
        risk_factors.extend(weather_alerts)

        # Criticality Evidence
        if not has_crit_measured:
            risk_factors.append("Substation criticality data unavailable (default neutral 50.0 applied)")
        elif crit_score >= 80.0:
            risk_factors.append(f"High grid criticality substation (infrastructure impact score: {crit_score:.1f})")

        # Deduplicate while preserving insertion order
        unique_risk_factors = list(dict.fromkeys(risk_factors))

        # 8. Build Telemetry Snapshot
        telemetry_snapshot = _build_telemetry_snapshot(raw_asset)

        # 9. Assemble Output Record
        record: Dict[str, Any] = {
            "asset_id": asset_id,
            "substation_id": substation_id,
            "dga_health_index": dga_health_index,
            "dga_status": dga_status,
            "primary_fault_type": primary_fault_type,
            "physical_health_score": physical_health_score,
            "weather_multiplier": weather_multiplier,
            "grid_criticality_score": crit_score,
            "composite_risk_score": composite_risk_score,
            "risk_category": risk_category,
            "risk_factors": unique_risk_factors,
            "suggested_action": suggested_action,
            "telemetry_snapshot": telemetry_snapshot,
        }
        ranked_results.append(record)

    # 10. Sort descending by composite_risk_score, physical_health_score, asset_id
    ranked_results.sort(
        key=lambda r: (
            -r["composite_risk_score"],
            -r["physical_health_score"],
            str(r["asset_id"]),
        )
    )

    return ranked_results
