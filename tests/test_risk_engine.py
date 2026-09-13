"""
Unit tests for GridSentinel AI - Comprehensive Outage Risk & Prioritization Engine
Module: tests/test_risk_engine.py
Owner: Person 1 (Khushi)
"""

import copy
import math
import pytest
from src.risk_engine import calculate_comprehensive_risk


# =============================================================================
# FIXTURES & BASE TEST DATA
# =============================================================================

@pytest.fixture
def base_healthy_asset():
    return {
        "asset_id": "TX-HEALTHY-01",
        "substation_id": "SUB-NORTH-01",
        "rated_mva": 100,
        "voltage_kv": 220,
        "installation_year": 2018,
        "dga_ppm": {
            "hydrogen": 20,
            "methane": 10,
            "ethane": 8,
            "ethylene": 5,
            "acetylene": 0.1,
        },
        "oil_temperature": 62.0,
        "vibration_level": 1.8,
        "electrical_load_pct": 65,
        "previous_fault_history": 0,
    }


@pytest.fixture
def base_calm_weather():
    return {
        "substation_id": "SUB-NORTH-01",
        "ambient_temperature": 24.0,
        "wind_gust_speed": 18.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }


@pytest.fixture
def base_substations():
    return [
        {
            "substation_id": "SUB-NORTH-01",
            "name": "North Metro Substation",
            "criticality_score": 50.0,
            "hospitals_connected": 2,
        }
    ]


# =============================================================================
# 1. HEALTHY ASSET
# =============================================================================

def test_healthy_asset_baseline(base_healthy_asset, base_calm_weather, base_substations):
    """Verify healthy asset in calm weather with neutral criticality produces low risk."""
    results = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)

    assert isinstance(results, list)
    assert len(results) == 1
    res = results[0]

    assert res["asset_id"] == "TX-HEALTHY-01"
    assert res["substation_id"] == "SUB-NORTH-01"
    assert math.isfinite(res["composite_risk_score"])
    assert 0.0 <= res["composite_risk_score"] <= 100.0
    assert res["physical_health_score"] < 20.0
    assert res["weather_multiplier"] == 1.0
    assert res["grid_criticality_score"] == 50.0
    assert res["risk_category"] == "LOW"
    assert res["dga_status"] == "NORMAL"
    assert res["primary_fault_type"] == "NONE"


# =============================================================================
# 2. HIGH ACETYLENE / ARCING
# =============================================================================

def test_high_acetylene_arcing(base_healthy_asset, base_calm_weather, base_substations):
    """Verify arcing asset elevates physical score, composite risk, and primary fault."""
    healthy_res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)[0]

    arcing_asset = copy.deepcopy(base_healthy_asset)
    arcing_asset["asset_id"] = "TX-ARC-01"
    arcing_asset["dga_ppm"]["acetylene"] = 28.0

    arcing_res = calculate_comprehensive_risk([arcing_asset], base_calm_weather, base_substations)[0]

    assert arcing_res["primary_fault_type"] == "ARCING"
    assert arcing_res["physical_health_score"] > healthy_res["physical_health_score"]
    assert arcing_res["composite_risk_score"] > healthy_res["composite_risk_score"]
    assert any("acetylene" in f.lower() or "arcing" in f.lower() for f in arcing_res["risk_factors"])


# =============================================================================
# 3. THERMAL FAULT
# =============================================================================

def test_thermal_fault_elevation(base_healthy_asset, base_calm_weather, base_substations):
    """Verify high ethylene and oil temperature elevate physical risk and indicate thermal fault."""
    healthy_res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)[0]

    thermal_asset = copy.deepcopy(base_healthy_asset)
    thermal_asset["asset_id"] = "TX-THERMAL-01"
    thermal_asset["dga_ppm"]["ethylene"] = 180.0
    thermal_asset["oil_temperature"] = 96.0

    thermal_res = calculate_comprehensive_risk([thermal_asset], base_calm_weather, base_substations)[0]

    assert thermal_res["primary_fault_type"] == "THERMAL_OVERHEAT"
    assert thermal_res["physical_health_score"] > healthy_res["physical_health_score"]
    assert thermal_res["composite_risk_score"] > healthy_res["composite_risk_score"]
    assert any("ethylene" in f.lower() or "thermal" in f.lower() for f in thermal_res["risk_factors"])


# =============================================================================
# 4. HIGH VIBRATION
# =============================================================================

def test_high_vibration_mechanical_stress(base_healthy_asset, base_calm_weather, base_substations):
    """Verify high vibration triggers mechanical stress and reflects in risk factors."""
    healthy_res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)[0]

    vib_asset = copy.deepcopy(base_healthy_asset)
    vib_asset["asset_id"] = "TX-VIB-01"
    vib_asset["vibration_level"] = 7.2

    vib_res = calculate_comprehensive_risk([vib_asset], base_calm_weather, base_substations)[0]

    assert vib_res["primary_fault_type"] == "MECHANICAL_STRESS"
    assert vib_res["physical_health_score"] > healthy_res["physical_health_score"]
    assert vib_res["composite_risk_score"] > healthy_res["composite_risk_score"]
    assert any("vibration" in f.lower() for f in vib_res["risk_factors"])


# =============================================================================
# 5. SEVERE WEATHER
# =============================================================================

def test_severe_weather_elevation(base_healthy_asset, base_substations):
    """Verify severe weather conditions elevate composite risk even for physically sound transformers."""
    calm_w = {"substation_id": "SUB-NORTH-01", "ambient_temperature": 25.0, "storm_severity": "NONE"}
    severe_w = {
        "substation_id": "SUB-NORTH-01",
        "ambient_temperature": 43.0,
        "wind_gust_speed": 110.0,
        "lightning_activity": 9.0,
        "storm_severity": "EXTREME",
        "heatwave_alert": True,
    }

    calm_res = calculate_comprehensive_risk([base_healthy_asset], calm_w, base_substations)[0]
    severe_res = calculate_comprehensive_risk([base_healthy_asset], severe_w, base_substations)[0]

    assert severe_res["weather_multiplier"] > calm_res["weather_multiplier"]
    assert severe_res["composite_risk_score"] > calm_res["composite_risk_score"]
    assert severe_res["composite_risk_score"] <= 100.0
    assert any("wind" in f.lower() or "storm" in f.lower() for f in severe_res["risk_factors"])


# =============================================================================
# 6. WEATHER NORMALIZATION & EXACT COMPOSITE FORMULA
# =============================================================================

def test_exact_risk_formula_calculation():
    """Verify exact weighted composite formula: 0.60 * physical + 0.20 * weather_risk + 0.20 * criticality."""
    # Controlled asset where DGA physical score is known
    asset = {
        "asset_id": "TX-FORMULA",
        "substation_id": "SUB-01",
        "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
        "oil_temperature": 60.0,
        "vibration_level": 1.5,
    }
    # Calm weather -> multiplier 1.0 -> weather_risk = ((1.0 - 1.0)/0.5)*100 = 0.0
    weather = {"substation_id": "SUB-01", "ambient_temperature": 25.0, "storm_severity": "NONE"}
    substations = [{"substation_id": "SUB-01", "criticality_score": 60.0}]

    res = calculate_comprehensive_risk([asset], weather, substations)[0]

    phys = res["physical_health_score"]  # 0.0
    w_mult = res["weather_multiplier"]   # 1.0
    crit = res["grid_criticality_score"] # 60.0

    w_risk = ((w_mult - 1.0) / 0.5) * 100.0
    expected_composite = round(0.60 * phys + 0.20 * w_risk + 0.20 * crit, 1)

    assert res["composite_risk_score"] == expected_composite


# =============================================================================
# 7. CRITICALITY INTEGRATION & ALIASES
# =============================================================================

@pytest.mark.parametrize("alias_key", [
    "criticality_score",
    "grid_criticality_score",
    "substation_criticality_score",
    "criticality",
])
def test_criticality_aliases_and_monotonicity(base_healthy_asset, base_calm_weather, alias_key):
    """Verify supported criticality aliases are parsed and higher criticality yields higher risk."""
    sub_low = [{"substation_id": "SUB-NORTH-01", alias_key: 20.0}]
    sub_high = [{"substation_id": "SUB-NORTH-01", alias_key: 90.0}]

    res_low = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, sub_low)[0]
    res_high = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, sub_high)[0]

    assert res_low["grid_criticality_score"] == 20.0
    assert res_high["grid_criticality_score"] == 90.0
    assert res_high["composite_risk_score"] > res_low["composite_risk_score"]


# =============================================================================
# 8. MISSING CRITICALITY
# =============================================================================

def test_missing_criticality_defaults_to_neutral(base_healthy_asset, base_calm_weather):
    """Verify missing criticality gracefully defaults to neutral 50.0 and appends explanatory factor."""
    results = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, [])

    assert len(results) == 1
    res = results[0]
    assert res["grid_criticality_score"] == 50.0
    assert any("criticality data unavailable" in f.lower() for f in res["risk_factors"])
    assert math.isfinite(res["composite_risk_score"])


# =============================================================================
# 9. CRITICALITY BOUNDS & MALFORMED VALUES
# =============================================================================

@pytest.mark.parametrize("bad_crit, expected_val", [
    (-50.0, 0.0),
    (150.0, 100.0),
    (float("nan"), 50.0),
    (float("inf"), 50.0),
    (None, 50.0),
    ("invalid", 50.0),
])
def test_criticality_bounds_and_guards(base_healthy_asset, base_calm_weather, bad_crit, expected_val):
    """Verify criticality out of bounds or non-numeric values are safely clamped or defaulted."""
    subs = [{"substation_id": "SUB-NORTH-01", "criticality_score": bad_crit}]
    res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, subs)[0]

    assert res["grid_criticality_score"] == expected_val
    assert 0.0 <= res["grid_criticality_score"] <= 100.0
    assert math.isfinite(res["grid_criticality_score"])


# =============================================================================
# 10. WEATHER MATCHING (SINGLE, MULTIPLE, REGION)
# =============================================================================

def test_weather_matching_single_and_multiple():
    """Verify weather records are correctly mapped to matching substation IDs."""
    asset_sub1 = {"asset_id": "TX-01", "substation_id": "SUB-CALM", "oil_temperature": 60.0}
    asset_sub2 = {"asset_id": "TX-02", "substation_id": "SUB-STORM", "oil_temperature": 60.0}

    multi_weather = [
        {"substation_id": "SUB-CALM", "ambient_temperature": 22.0, "storm_severity": "NONE"},
        {"substation_id": "SUB-STORM", "wind_gust_speed": 110.0, "storm_severity": "EXTREME"},
    ]

    results = calculate_comprehensive_risk([asset_sub1, asset_sub2], multi_weather, [])
    res_map = {r["asset_id"]: r for r in results}

    assert res_map["TX-01"]["weather_multiplier"] == 1.0
    assert res_map["TX-02"]["weather_multiplier"] > 1.2


def test_weather_matching_region_id():
    """Verify region_id in weather records is supported when substation uses region mapping."""
    asset = {"asset_id": "TX-REG", "substation_id": "REGION-EAST", "oil_temperature": 60.0}
    weather = [{"region_id": "REGION-EAST", "wind_gust_speed": 80.0}]

    res = calculate_comprehensive_risk([asset], weather, [])[0]
    assert res["weather_multiplier"] == 1.08


# =============================================================================
# 11. MISSING WEATHER
# =============================================================================

@pytest.mark.parametrize("bad_weather", [None, {}, [], "invalid"])
def test_missing_weather_handled_safely(base_healthy_asset, base_substations, bad_weather):
    """Verify missing, empty, or non-dict weather input defaults safely to baseline 1.0."""
    res = calculate_comprehensive_risk([base_healthy_asset], bad_weather, base_substations)[0]

    assert res["weather_multiplier"] == 1.0
    assert math.isfinite(res["composite_risk_score"])
    assert any("weather" in f.lower() and "unavailable" in f.lower() for f in res["risk_factors"])


# =============================================================================
# 12. SUBSTATION MATCHING
# =============================================================================

def test_substation_matching_and_unmatched():
    """Verify each asset is assigned its specific substation criticality score."""
    asset1 = {"asset_id": "TX-1", "substation_id": "SUB-A"}
    asset2 = {"asset_id": "TX-2", "substation_id": "SUB-B"}
    asset3 = {"asset_id": "TX-3", "substation_id": "SUB-UNMATCHED"}

    subs = [
        {"substation_id": "SUB-A", "criticality_score": 30.0},
        {"substation_id": "SUB-B", "criticality_score": 90.0},
    ]

    results = calculate_comprehensive_risk([asset1, asset2, asset3], {}, subs)
    res_map = {r["asset_id"]: r for r in results}

    assert res_map["TX-1"]["grid_criticality_score"] == 30.0
    assert res_map["TX-2"]["grid_criticality_score"] == 90.0
    assert res_map["TX-3"]["grid_criticality_score"] == 50.0  # default for unmatched


# =============================================================================
# 13. COMPOUND CRITICAL CASE
# =============================================================================

def test_compound_critical_scenario():
    """Verify severe arcing + severe oil temp + severe weather + high criticality triggers CRITICAL category."""
    critical_asset = {
        "asset_id": "TX-CRIT-01",
        "substation_id": "SUB-CRIT",
        "dga_ppm": {
            "hydrogen": 450.0,
            "methane": 500.0,
            "ethane": 200.0,
            "ethylene": 280.0,
            "acetylene": 45.0,
        },
        "oil_temperature": 118.0,
        "vibration_level": 7.5,
    }
    severe_weather = {
        "substation_id": "SUB-CRIT",
        "ambient_temperature": 44.0,
        "wind_gust_speed": 115.0,
        "lightning_activity": 10.0,
        "storm_severity": "EXTREME",
        "heatwave_alert": True,
    }
    high_subs = [{"substation_id": "SUB-CRIT", "criticality_score": 95.0}]

    res = calculate_comprehensive_risk([critical_asset], severe_weather, high_subs)[0]

    assert res["composite_risk_score"] >= 80.0
    assert res["composite_risk_score"] <= 100.0
    assert res["risk_category"] == "CRITICAL"
    assert res["primary_fault_type"] == "ARCING"
    assert len(res["risk_factors"]) >= 4


# =============================================================================
# 14. RISK CATEGORY BOUNDARIES
# =============================================================================

def test_risk_category_boundary_mapping():
    """Verify score transitions across LOW, MEDIUM, HIGH, and CRITICAL thresholds."""
    # Case LOW (<30)
    asset_low = {"asset_id": "A_LOW", "substation_id": "SUB-LOW", "oil_temperature": 55.0}
    res_low = calculate_comprehensive_risk(
        [asset_low],
        {"substation_id": "SUB-LOW", "ambient_temperature": 20.0},
        [{"substation_id": "SUB-LOW", "criticality_score": 20.0}],
    )[0]
    assert res_low["composite_risk_score"] < 30.0
    assert res_low["risk_category"] == "LOW"

    # Case CRITICAL (>=80)
    crit_asset = {
        "asset_id": "A_CRIT",
        "substation_id": "SUB-CRIT",
        "dga_ppm": {"acetylene": 50.0, "ethylene": 200.0},
        "oil_temperature": 125.0,
        "vibration_level": 8.0,
    }
    res_crit = calculate_comprehensive_risk(
        [crit_asset],
        {"substation_id": "SUB-CRIT", "storm_severity": "EXTREME", "wind_gust_speed": 110.0, "lightning_strikes_per_min": 10.0},
        [{"substation_id": "SUB-CRIT", "criticality_score": 100.0}],
    )[0]

    assert res_crit["composite_risk_score"] >= 80.0
    assert res_crit["risk_category"] == "CRITICAL"


# =============================================================================
# 15. SUGGESTED ACTIONS
# =============================================================================

def test_suggested_actions_correspond_to_category(base_healthy_asset, base_calm_weather, base_substations):
    """Verify suggested_action is a non-empty string aligned with the risk category."""
    res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)[0]

    assert isinstance(res["suggested_action"], str)
    assert len(res["suggested_action"].strip()) > 0
    if res["risk_category"] == "LOW":
        assert "monitoring" in res["suggested_action"].lower()


# =============================================================================
# 16. RISK FACTOR CONTRACT
# =============================================================================

def test_risk_factor_list_contract():
    """Verify risk_factors is a list of unique, non-empty, deterministic strings."""
    asset = {
        "asset_id": "TX-FLAGS",
        "dga_ppm": {"acetylene": 25.0},
        "oil_temperature": 92.0,
    }
    weather = {"wind_gust_speed": 85.0, "ambient_temperature": 39.0, "heatwave_alert": True}

    res = calculate_comprehensive_risk([asset], weather, [])[0]

    factors = res["risk_factors"]
    assert isinstance(factors, list)
    for f in factors:
        assert isinstance(f, str)
        assert len(f.strip()) > 0
    # No duplicate factors
    assert len(factors) == len(set(factors))


# =============================================================================
# 17. TELEMETRY SNAPSHOT PRESERVATION
# =============================================================================

def test_telemetry_snapshot_preservation():
    """Verify original raw telemetry fields are preserved without mutating the input asset."""
    original_asset = {
        "asset_id": "TX-SNAPSHOT",
        "substation_id": "SUB-SNAP",
        "rated_mva": 150,
        "voltage_kv": 230,
        "installation_year": 2015,
        "dga_ppm": {"hydrogen": 50, "acetylene": 5.0},
        "oil_temperature": 75.0,
        "vibration_level": 2.2,
        "electrical_load_pct": 80,
        "previous_fault_history": 1,
    }
    asset_copy = copy.deepcopy(original_asset)

    res = calculate_comprehensive_risk([original_asset], {}, [])[0]

    # Input asset must not be mutated
    assert original_asset == asset_copy

    # Snapshot contains preserved fields
    snapshot = res["telemetry_snapshot"]
    assert snapshot["asset_id"] == "TX-SNAPSHOT"
    assert snapshot["rated_mva"] == 150
    assert snapshot["voltage_kv"] == 230
    assert snapshot["installation_year"] == 2015
    assert snapshot["oil_temperature"] == 75.0


# =============================================================================
# 18. MULTIPLE ASSETS & DESCENDING RANKING
# =============================================================================

def test_multiple_assets_descending_ranking():
    """Verify multiple assets are ranked descending by composite risk score."""
    assets = [
        {"asset_id": "TX-LOW", "dga_ppm": {"acetylene": 0.1}},
        {"asset_id": "TX-MED", "dga_ppm": {"acetylene": 5.0}},
        {"asset_id": "TX-HIGH", "dga_ppm": {"acetylene": 20.0}},
        {"asset_id": "TX-CRIT", "dga_ppm": {"acetylene": 45.0}, "oil_temperature": 115.0},
    ]

    results = calculate_comprehensive_risk(assets, {}, [])

    assert len(results) == 4
    for i in range(len(results) - 1):
        assert results[i]["composite_risk_score"] >= results[i + 1]["composite_risk_score"]


# =============================================================================
# 19. DETERMINISTIC TIE-BREAKING
# =============================================================================

def test_deterministic_tie_breaking():
    """Verify tie-breaking by physical score and alphabetical asset_id, with repeat determinism."""
    # Identical assets except for asset_id
    asset_b = {"asset_id": "TX-BETA", "oil_temperature": 70.0}
    asset_a = {"asset_id": "TX-ALPHA", "oil_temperature": 70.0}

    results1 = calculate_comprehensive_risk([asset_b, asset_a], {}, [])
    results2 = calculate_comprehensive_risk([asset_b, asset_a], {}, [])

    # Tie break should place TX-ALPHA before TX-BETA
    assert results1[0]["asset_id"] == "TX-ALPHA"
    assert results1[1]["asset_id"] == "TX-BETA"

    # Strict repeatability
    assert results1 == results2


# =============================================================================
# 20. MALFORMED ASSETS
# =============================================================================

@pytest.mark.parametrize("bad_assets", [None, [], "invalid", [None], ["not_a_dict"]])
def test_malformed_assets_handled_safely(bad_assets):
    """Verify non-list inputs or assets containing None/invalid types never crash."""
    results = calculate_comprehensive_risk(bad_assets, {}, [])

    assert isinstance(results, list)
    for r in results:
        assert math.isfinite(r["composite_risk_score"])
        assert 0.0 <= r["composite_risk_score"] <= 100.0


# =============================================================================
# 21. OUTPUT NUMERIC INVARIANTS
# =============================================================================

def test_output_numeric_invariants(base_healthy_asset):
    """Verify all numeric fields satisfy range bounds and finiteness."""
    results = calculate_comprehensive_risk([base_healthy_asset], {}, [])
    res = results[0]

    assert 0.0 <= res["physical_health_score"] <= 100.0
    assert 0.0 <= res["dga_health_index"] <= 100.0
    assert 1.0 <= res["weather_multiplier"] <= 1.5
    assert 0.0 <= res["grid_criticality_score"] <= 100.0
    assert 0.0 <= res["composite_risk_score"] <= 100.0

    assert math.isfinite(res["physical_health_score"])
    assert math.isfinite(res["dga_health_index"])
    assert math.isfinite(res["weather_multiplier"])
    assert math.isfinite(res["grid_criticality_score"])
    assert math.isfinite(res["composite_risk_score"])


# =============================================================================
# 22. NO NaN / INF LEAKAGE
# =============================================================================

def test_no_nan_or_inf_leakage():
    """Verify NaN and Inf values in inputs never leak into any numeric outputs."""
    corrupted_asset = {
        "asset_id": "TX-CORRUPT",
        "dga_ppm": {"acetylene": float("nan"), "ethylene": float("inf")},
        "oil_temperature": float("inf"),
        "vibration_level": float("nan"),
    }
    corrupted_weather = {
        "ambient_temperature": float("nan"),
        "wind_gust_speed": float("inf"),
    }
    corrupted_subs = [{"substation_id": "SUB-CORRUPT", "criticality_score": float("nan")}]

    res = calculate_comprehensive_risk([corrupted_asset], corrupted_weather, corrupted_subs)[0]

    assert not math.isnan(res["physical_health_score"])
    assert not math.isinf(res["physical_health_score"])
    assert not math.isnan(res["weather_multiplier"])
    assert not math.isinf(res["weather_multiplier"])
    assert not math.isnan(res["grid_criticality_score"])
    assert not math.isinf(res["grid_criticality_score"])
    assert not math.isnan(res["composite_risk_score"])
    assert not math.isinf(res["composite_risk_score"])


# =============================================================================
# 23. MONOTONICITY
# =============================================================================

def test_monotonicity_physical_health(base_calm_weather, base_substations):
    """Verify increasing physical damage does not decrease composite risk score."""
    c2h2_levels = [0.1, 2.5, 10.0, 20.0, 40.0]
    scores = []
    for c in c2h2_levels:
        asset = {"asset_id": "TX-M", "dga_ppm": {"acetylene": c}, "oil_temperature": 65.0}
        res = calculate_comprehensive_risk([asset], base_calm_weather, base_substations)[0]
        scores.append(res["composite_risk_score"])

    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1]


def test_monotonicity_criticality(base_healthy_asset, base_calm_weather):
    """Verify increasing criticality score does not decrease composite risk score."""
    crit_levels = [10.0, 30.0, 50.0, 70.0, 90.0]
    scores = []
    for c in crit_levels:
        subs = [{"substation_id": "SUB-NORTH-01", "criticality_score": c}]
        res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, subs)[0]
        scores.append(res["composite_risk_score"])

    for i in range(len(scores) - 1):
        assert scores[i] <= scores[i + 1]


# =============================================================================
# 24. DASHBOARD-FRIENDLY COMPLETE OUTPUT CONTRACT
# =============================================================================

def test_dashboard_friendly_complete_output_contract(base_healthy_asset, base_calm_weather, base_substations):
    """Verify all 13 required dashboard fields exist and match their expected types."""
    required_keys = {
        "asset_id": str,
        "substation_id": str,
        "dga_health_index": float,
        "dga_status": str,
        "primary_fault_type": str,
        "physical_health_score": float,
        "weather_multiplier": float,
        "grid_criticality_score": float,
        "composite_risk_score": float,
        "risk_category": str,
        "risk_factors": list,
        "suggested_action": str,
        "telemetry_snapshot": dict,
    }

    res = calculate_comprehensive_risk([base_healthy_asset], base_calm_weather, base_substations)[0]

    for key, expected_type in required_keys.items():
        assert key in res, f"Missing required key: {key}"
        assert isinstance(res[key], expected_type), f"Key {key} expected {expected_type}, got {type(res[key])}"
