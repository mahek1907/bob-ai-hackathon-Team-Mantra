"""
Unit tests for GridSentinel AI - DGA & Physical Health Diagnostic Engine
Module: tests/test_dga_engine.py
Owner: Person 1 (Khushi)
"""

import math
import pytest
from src.dga_engine import evaluate_dga_and_health


# =============================================================================
# 1. HEALTHY TRANSFORMER
# =============================================================================

def test_healthy_transformer():
    """Verify healthy telemetry produces low score, NORMAL status, and no fault."""
    asset = {
        "asset_id": "TX-HEALTHY",
        "substation_id": "SUB-01",
        "dga_ppm": {
            "hydrogen": 20,
            "methane": 10,
            "ethane": 8,
            "ethylene": 5,
            "acetylene": 0.1,
        },
        "oil_temperature": 62.0,
        "vibration_level": 1.8,
    }
    result = evaluate_dga_and_health(asset)

    assert isinstance(result, dict)
    assert result["asset_id"] == "TX-HEALTHY"
    assert result["substation_id"] == "SUB-01"
    assert 0.0 <= result["physical_health_score"] <= 100.0
    assert result["physical_health_score"] < 20.0
    assert result["dga_status"] == "NORMAL"
    assert result["primary_fault_type"] == "NONE"
    assert result["sensor_quality"] == "GOOD"
    assert isinstance(result["fault_flags"], list)
    assert len(result["fault_flags"]) == 0


# =============================================================================
# 2. HIGH ACETYLENE / ARCING
# =============================================================================

def test_high_acetylene_arcing():
    """Verify elevated/severe acetylene identifies arcing and increases risk."""
    healthy_baseline = {
        "asset_id": "TX-BASE",
        "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
        "oil_temperature": 70.0,
        "vibration_level": 2.0,
    }
    healthy_score = evaluate_dga_and_health(healthy_baseline)["physical_health_score"]

    asset_arcing = {
        "asset_id": "TX-ARC",
        "dga_ppm": {
            "acetylene": 28.0,
            "ethylene": 15.0,
        },
        "oil_temperature": 70.0,
        "vibration_level": 2.0,
    }
    result = evaluate_dga_and_health(asset_arcing)

    assert result["physical_health_score"] > healthy_score
    assert result["physical_health_score"] <= 100.0
    assert result["primary_fault_type"] == "ARCING"
    assert any("acetylene" in f.lower() or "arcing" in f.lower() for f in result["fault_flags"])
    # Ensure responsible language without false certainty
    for flag in result["fault_flags"]:
        assert "confirmed failure" not in flag.lower()


# =============================================================================
# 3. HIGH ETHYLENE / THERMAL OVERHEATING
# =============================================================================

def test_high_ethylene_thermal_overheating():
    """Verify high ethylene triggers THERMAL_OVERHEAT fault and flags."""
    asset = {
        "asset_id": "TX-THERMAL",
        "dga_ppm": {
            "ethylene": 160.0,
        },
        "oil_temperature": 98.0,
        "vibration_level": 2.1,
    }
    result = evaluate_dga_and_health(asset)

    assert result["physical_health_score"] > 0.0
    assert result["physical_health_score"] <= 100.0
    assert result["primary_fault_type"] == "THERMAL_OVERHEAT"
    assert any("ethylene" in f.lower() or "thermal" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 4. HIGH OIL TEMPERATURE
# =============================================================================

def test_high_oil_temperature():
    """Verify severe oil temperature triggers thermal warnings and risk elevation."""
    healthy_asset = {
        "asset_id": "TX-NORM",
        "dga_ppm": {"hydrogen": 20, "methane": 10, "ethane": 8, "ethylene": 5, "acetylene": 0.1},
        "oil_temperature": 62.0,
        "vibration_level": 1.8,
    }
    healthy_score = evaluate_dga_and_health(healthy_asset)["physical_health_score"]

    asset_hot = {
        "asset_id": "TX-HOT",
        "dga_ppm": {
            "hydrogen": 20,
            "methane": 10,
            "ethane": 8,
            "ethylene": 5,
            "acetylene": 0.1,
        },
        "oil_temperature": 110.0,
        "vibration_level": 1.8,
    }
    result = evaluate_dga_and_health(asset_hot)

    assert result["physical_health_score"] > healthy_score
    assert result["physical_health_score"] <= 100.0
    assert result["primary_fault_type"] == "THERMAL_OVERHEAT"
    assert any("temperature" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 5. HIGH VIBRATION
# =============================================================================

def test_high_vibration():
    """Verify severe mechanical vibration triggers MECHANICAL_STRESS fault."""
    healthy_asset = {
        "asset_id": "TX-NORM",
        "dga_ppm": {"hydrogen": 20, "methane": 10, "ethane": 8, "ethylene": 5, "acetylene": 0.1},
        "oil_temperature": 62.0,
        "vibration_level": 1.8,
    }
    healthy_score = evaluate_dga_and_health(healthy_asset)["physical_health_score"]

    asset_vib = {
        "asset_id": "TX-VIB",
        "dga_ppm": {
            "hydrogen": 20,
            "methane": 10,
            "ethane": 8,
            "ethylene": 5,
            "acetylene": 0.1,
        },
        "oil_temperature": 62.0,
        "vibration_level": 7.5,
    }
    result = evaluate_dga_and_health(asset_vib)

    assert result["physical_health_score"] > healthy_score
    assert result["physical_health_score"] <= 100.0
    assert result["primary_fault_type"] == "MECHANICAL_STRESS"
    assert any("vibration" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 6. COMPOUND CRITICAL CONDITION
# =============================================================================

def test_compound_critical_condition():
    """Verify simultaneous severe DGA, temperature, and vibration reaches critical bounds."""
    asset = {
        "asset_id": "TX-COMPOUND-CRIT",
        "dga_ppm": {
            "hydrogen": 450.0,
            "methane": 500.0,
            "ethane": 250.0,
            "ethylene": 280.0,
            "acetylene": 45.0,
        },
        "oil_temperature": 125.0,
        "vibration_level": 8.0,
    }
    result = evaluate_dga_and_health(asset)

    assert result["physical_health_score"] == 100.0
    assert result["dga_status"] == "CRITICAL"
    # Precedence check: arcing takes priority over thermal and mechanical
    assert result["primary_fault_type"] == "ARCING"


# =============================================================================
# 7. MISSING DATA
# =============================================================================

def test_missing_data():
    """Verify missing telemetry is safely handled and penalized, not marked healthy."""
    asset = {
        "asset_id": "TX-MISSING",
        "oil_temperature": 70.0,
        "vibration_level": 2.0,
    }
    result = evaluate_dga_and_health(asset)

    assert isinstance(result, dict)
    assert 0.0 <= result["physical_health_score"] <= 100.0
    # Must not be falsely treated as healthy 0.0
    assert result["physical_health_score"] > 0.0
    assert result["sensor_quality"] in ("DEGRADED", "INVALID")
    assert result["sensor_quality"] != "GOOD"
    assert any("missing" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 8. MALFORMED DATA
# =============================================================================

@pytest.mark.parametrize("bad_val", [
    None,
    "",
    "not-a-number",
    True,
    float("nan"),
    float("inf"),
    float("-inf"),
])
def test_malformed_sensor_data_does_not_crash(bad_val):
    """Verify function does not crash on malformed sensor inputs and stays bounded."""
    asset = {
        "asset_id": "TX-MALFORMED",
        "dga_ppm": {
            "acetylene": bad_val,
            "ethylene": 10.0,
        },
        "oil_temperature": bad_val,
        "vibration_level": bad_val,
    }
    result = evaluate_dga_and_health(asset)

    assert isinstance(result, dict)
    score = result["physical_health_score"]
    assert not math.isnan(score)
    assert not math.isinf(score)
    assert 0.0 <= score <= 100.0
    assert result["sensor_quality"] in ("DEGRADED", "INVALID")


# =============================================================================
# 9. NEGATIVE SENSOR VALUES
# =============================================================================

def test_negative_sensor_values():
    """Verify negative gas concentrations and vibrations are flagged and do not subtract risk."""
    asset = {
        "asset_id": "TX-NEG",
        "dga_ppm": {
            "acetylene": -5.0,
            "ethylene": -10.0,
        },
        "oil_temperature": 60.0,
        "vibration_level": -2.0,
    }
    result = evaluate_dga_and_health(asset)

    assert isinstance(result, dict)
    assert 0.0 <= result["physical_health_score"] <= 100.0
    assert result["sensor_quality"] in ("DEGRADED", "INVALID")
    assert any("negative" in f.lower() or "implausible" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 10. IMPOSSIBLE TEMPERATURE
# =============================================================================

@pytest.mark.parametrize("extreme_temp", [-55.0, 220.0])
def test_impossible_oil_temperature(extreme_temp):
    """Verify extreme out-of-bounds temperatures are flagged as sensor plausibility faults."""
    asset = {
        "asset_id": "TX-IMPOSSIBLE-TEMP",
        "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
        "oil_temperature": extreme_temp,
        "vibration_level": 2.0,
    }
    result = evaluate_dga_and_health(asset)

    assert isinstance(result, dict)
    assert 0.0 <= result["physical_health_score"] <= 100.0
    assert any("temperature" in f.lower() and "plausible" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 11. ALIAS SUPPORT
# =============================================================================

def test_alias_support():
    """Verify key aliases (c2h4_ppm, oil_temp_c, vibration_mm_s) are properly resolved."""
    asset = {
        "asset_id": "TX-ALIAS",
        "c2h4_ppm": 160.0,
        "oil_temp_c": 98.0,
        "vibration_mm_s": 2.1,
    }
    result = evaluate_dga_and_health(asset)

    assert result["asset_id"] == "TX-ALIAS"
    assert result["physical_health_score"] > 0.0
    assert result["primary_fault_type"] == "THERMAL_OVERHEAT"
    assert any("ethylene" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 12. NON-DICT INPUT
# =============================================================================

@pytest.mark.parametrize("invalid_input", [None, [], "invalid", 12345])
def test_non_dict_input(invalid_input):
    """Verify non-dictionary inputs gracefully return structured fallback diagnostics."""
    result = evaluate_dga_and_health(invalid_input)

    assert isinstance(result, dict)
    assert 0.0 <= result["physical_health_score"] <= 100.0
    assert result["sensor_quality"] == "INVALID"
    assert result["primary_fault_type"] == "DATA_QUALITY"
    assert any("not a dictionary" in f.lower() or "invalid" in f.lower() for f in result["fault_flags"])


# =============================================================================
# 13. BOUNDARY TESTS (MONOTONICITY & CONTINUITY)
# =============================================================================

def test_acetylene_boundary_monotonicity():
    """Verify acetylene transitions across 2.0 and 15.0 ppm are monotonic."""
    vals = [0.0, 1.9, 2.0, 2.1, 14.9, 15.0, 15.1, 30.0]
    scores = []
    for v in vals:
        asset = {
            "asset_id": f"TX-C2H2-{v}",
            "dga_ppm": {"acetylene": v, "ethylene": 10.0},
            "oil_temperature": 70.0,
            "vibration_level": 2.0,
        }
        scores.append(evaluate_dga_and_health(asset)["physical_health_score"])

    # Verify scores are non-decreasing
    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1], f"Non-monotonic at C2H2={vals[i]} -> {vals[i+1]}"


def test_ethylene_boundary_monotonicity():
    """Verify ethylene transitions across 50.0 and 150.0 ppm are monotonic."""
    vals = [0.0, 49.9, 50.0, 50.1, 149.9, 150.0, 150.1, 250.0]
    scores = []
    for v in vals:
        asset = {
            "asset_id": f"TX-C2H4-{v}",
            "dga_ppm": {"acetylene": 0.1, "ethylene": v},
            "oil_temperature": 70.0,
            "vibration_level": 2.0,
        }
        scores.append(evaluate_dga_and_health(asset)["physical_health_score"])

    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1], f"Non-monotonic at C2H4={vals[i]} -> {vals[i+1]}"


def test_oil_temp_boundary_monotonicity():
    """Verify oil temperature transitions across 75, 85, and 105 C are monotonic."""
    vals = [50.0, 75.0, 75.1, 85.0, 85.1, 105.0, 105.1, 130.0]
    scores = []
    for v in vals:
        asset = {
            "asset_id": f"TX-TEMP-{v}",
            "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
            "oil_temperature": v,
            "vibration_level": 2.0,
        }
        scores.append(evaluate_dga_and_health(asset)["physical_health_score"])

    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1], f"Non-monotonic at Temp={vals[i]} -> {vals[i+1]}"


def test_vibration_boundary_monotonicity():
    """Verify vibration transitions across 2.5, 3.5, and 5.5 mm/s are monotonic."""
    vals = [1.0, 2.5, 2.51, 3.5, 3.51, 5.5, 5.51, 10.0]
    scores = []
    for v in vals:
        asset = {
            "asset_id": f"TX-VIB-{v}",
            "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
            "oil_temperature": 70.0,
            "vibration_level": v,
        }
        scores.append(evaluate_dga_and_health(asset)["physical_health_score"])

    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1], f"Non-monotonic at Vib={vals[i]} -> {vals[i+1]}"


# =============================================================================
# 14. PROPERTY-STYLE SAFETY CHECKS
# =============================================================================

def test_property_score_bounds_and_structure():
    """Verify invariants: score in [0, 100], finite, fault_flags is list, output is dict."""
    telemetry_samples = [
        {},
        {"asset_id": "TX-EMPTY"},
        {"asset_id": "TX-LOW", "oil_temperature": 50.0, "vibration_level": 1.0},
        {"asset_id": "TX-MED", "dga_ppm": {"hydrogen": 150.0, "methane": 180.0}, "oil_temperature": 82.0},
        {"asset_id": "TX-EXTREME", "dga_ppm": {"acetylene": 999.0}, "oil_temperature": 160.0, "vibration_level": 30.0},
    ]

    for asset in telemetry_samples:
        result = evaluate_dga_and_health(asset)
        assert isinstance(result, dict)
        score = result["physical_health_score"]
        assert isinstance(score, float)
        assert not math.isnan(score)
        assert not math.isinf(score)
        assert 0.0 <= score <= 100.0
        assert isinstance(result["fault_flags"], list)
        assert result["dga_status"] in ("NORMAL", "ADVISORY", "WARNING", "CRITICAL")
        assert result["primary_fault_type"] in ("NONE", "ARCING", "THERMAL_OVERHEAT", "MECHANICAL_STRESS", "DATA_QUALITY")
        assert result["sensor_quality"] in ("GOOD", "DEGRADED", "INVALID")
