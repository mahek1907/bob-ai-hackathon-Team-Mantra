"""
Unit tests for GridSentinel AI - Weather Risk Severity Engine
Module: tests/test_weather_engine.py
Owner: Person 1 (Khushi)
"""

import math
import pytest
from src.weather_engine import calculate_weather_factor


# =============================================================================
# 1. CALM WEATHER
# =============================================================================

def test_calm_weather():
    """Verify nominal conditions produce baseline multiplier 1.0 and empty alerts."""
    weather = {
        "substation_id": "SUB-01",
        "ambient_temperature": 25.0,
        "wind_gust_speed": 20.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }
    result = calculate_weather_factor(65.0, weather)

    assert isinstance(result, dict)
    assert result["weather_multiplier"] == 1.0
    assert result["weather_alerts"] == []


# =============================================================================
# 2. HIGH AMBIENT TEMPERATURE
# =============================================================================

def test_high_ambient_temperature():
    """Verify ambient temperature >= 35°C increases multiplier and generates alert."""
    weather = {
        "ambient_temperature": 36.5,
        "wind_gust_speed": 15.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }
    result = calculate_weather_factor(65.0, weather)

    assert result["weather_multiplier"] > 1.0
    assert result["weather_multiplier"] <= 1.5
    assert any("ambient temperature" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 3. SEVERE AMBIENT TEMPERATURE
# =============================================================================

def test_severe_ambient_temperature():
    """Verify severe ambient temperature >= 42°C increases multiplier further and generates severe alert."""
    weather_high = {
        "ambient_temperature": 37.0,
        "wind_gust_speed": 15.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }
    weather_severe = {
        "ambient_temperature": 44.0,
        "wind_gust_speed": 15.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }
    res_high = calculate_weather_factor(65.0, weather_high)
    res_severe = calculate_weather_factor(65.0, weather_severe)

    assert res_severe["weather_multiplier"] > res_high["weather_multiplier"]
    assert any("severe ambient" in a.lower() for a in res_severe["weather_alerts"])


# =============================================================================
# 4. HEATWAVE ALERT
# =============================================================================

def test_heatwave_alert():
    """Verify heatwave_alert=True elevates multiplier and generates heatwave alert."""
    weather = {
        "ambient_temperature": 28.0,
        "wind_gust_speed": 15.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": True,
    }
    result = calculate_weather_factor(65.0, weather)

    assert result["weather_multiplier"] > 1.0
    assert any("heatwave" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 5. ELEVATED WIND
# =============================================================================

def test_elevated_wind():
    """Verify elevated wind gusts (50-75 km/h) elevate multiplier and produce wind alert."""
    weather = {
        "ambient_temperature": 22.0,
        "wind_gust_speed": 55.0,
        "lightning_activity": 0,
        "storm_severity": "NONE",
        "heatwave_alert": False,
    }
    result = calculate_weather_factor(65.0, weather)

    assert result["weather_multiplier"] > 1.0
    assert any("wind" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 6. HIGH WIND
# =============================================================================

def test_high_wind_increases_more_than_elevated():
    """Verify high wind (75-100 km/h) produces higher contribution than elevated wind."""
    elev_res = calculate_weather_factor(60.0, {"wind_gust_speed": 60.0})
    high_res = calculate_weather_factor(60.0, {"wind_gust_speed": 85.0})

    assert high_res["weather_multiplier"] > elev_res["weather_multiplier"]
    assert any("high wind" in a.lower() for a in high_res["weather_alerts"])


# =============================================================================
# 7. SEVERE WIND
# =============================================================================

def test_severe_wind():
    """Verify severe wind (>=100 km/h) generates severe alert and elevated multiplier."""
    result = calculate_weather_factor(60.0, {"wind_gust_speed": 115.0})

    assert result["weather_multiplier"] >= 1.12
    assert any("severe wind" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 8. INVALID/IMPLAUSIBLE WIND
# =============================================================================

@pytest.mark.parametrize("bad_wind", [-15.0, float("nan"), float("inf"), 450.0])
def test_invalid_implausible_wind(bad_wind):
    """Verify negative, NaN, Inf, and excessive (>300 km/h) wind do not crash or corrupt score."""
    result = calculate_weather_factor(65.0, {"wind_gust_speed": bad_wind})

    assert isinstance(result, dict)
    assert math.isfinite(result["weather_multiplier"])
    assert 1.0 <= result["weather_multiplier"] <= 1.5


# =============================================================================
# 9. LIGHTNING BOUNDARIES
# =============================================================================

def test_lightning_boundaries():
    """Verify lightning threshold steps at 3.0, 6.0, and 9.0 index values."""
    res_below_3 = calculate_weather_factor(60.0, {"lightning_activity": 2.5})
    res_at_3 = calculate_weather_factor(60.0, {"lightning_activity": 3.0})
    res_at_6 = calculate_weather_factor(60.0, {"lightning_activity": 6.0})
    res_at_9 = calculate_weather_factor(60.0, {"lightning_activity": 9.0})

    assert res_below_3["weather_multiplier"] == 1.0
    assert res_at_3["weather_multiplier"] == 1.04
    assert res_at_6["weather_multiplier"] == 1.08
    assert res_at_9["weather_multiplier"] == 1.12
    assert any("severe lightning" in a.lower() for a in res_at_9["weather_alerts"])


# =============================================================================
# 10. LIGHTNING STRIKES/HOUR DEMO MODE
# =============================================================================

def test_lightning_strikes_per_hour():
    """Verify hourly strikes (>10) are safely mapped and bounded with appropriate alert."""
    result = calculate_weather_factor(60.0, {"lightning_activity": 80.0})

    assert math.isfinite(result["weather_multiplier"])
    assert 1.0 < result["weather_multiplier"] <= 1.5
    assert any("lightning" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 11. STORM SEVERITY
# =============================================================================

def test_storm_severity_levels():
    """Verify storm levels NONE, WATCH, WARNING, EXTREME produce non-decreasing multipliers."""
    m_none = calculate_weather_factor(60.0, {"storm_severity": "NONE"})["weather_multiplier"]
    m_watch = calculate_weather_factor(60.0, {"storm_severity": "WATCH"})["weather_multiplier"]
    m_warn = calculate_weather_factor(60.0, {"storm_severity": "WARNING"})["weather_multiplier"]
    m_ext = calculate_weather_factor(60.0, {"storm_severity": "EXTREME"})["weather_multiplier"]

    assert m_none == 1.0
    assert m_none < m_watch < m_warn < m_ext
    assert m_ext <= 1.5


# =============================================================================
# 12. UNKNOWN STORM SEVERITY
# =============================================================================

@pytest.mark.parametrize("unk_storm", ["UNKNOWN", "invalid", "", None])
def test_unknown_storm_severity(unk_storm):
    """Verify unrecognized storm severity strings do not crash and generate no false severe alert."""
    result = calculate_weather_factor(60.0, {"storm_severity": unk_storm})

    assert result["weather_multiplier"] == 1.0
    assert not any("storm" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 13. OIL-TEMPERATURE INTERACTION
# =============================================================================

def test_oil_temperature_interaction_under_heat():
    """Verify hot environment + elevated/severe oil temp triggers cooling impairment alerts."""
    hot_weather = {"ambient_temperature": 38.0, "heatwave_alert": True}

    res_oil_normal = calculate_weather_factor(65.0, hot_weather)
    res_oil_elev = calculate_weather_factor(90.0, hot_weather)
    res_oil_sev = calculate_weather_factor(110.0, hot_weather)

    assert res_oil_normal["weather_multiplier"] < res_oil_elev["weather_multiplier"]
    assert res_oil_elev["weather_multiplier"] < res_oil_sev["weather_multiplier"]
    assert any("cooling" in a.lower() for a in res_oil_elev["weather_alerts"])
    assert any("severe cooling barrier" in a.lower() for a in res_oil_sev["weather_alerts"])


def test_no_oil_interaction_under_calm_ambient():
    """Verify hot oil does NOT trigger weather thermal interaction when ambient air is normal."""
    calm_weather = {"ambient_temperature": 22.0, "heatwave_alert": False}
    result = calculate_weather_factor(110.0, calm_weather)

    assert result["weather_multiplier"] == 1.0
    assert not any("cooling" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 14. INVALID OIL TEMPERATURE
# =============================================================================

@pytest.mark.parametrize("bad_temp", [None, "", "invalid", float("nan"), float("inf"), float("-inf"), -60.0, 250.0])
def test_invalid_oil_temperature_handled_safely(bad_temp):
    """Verify invalid or physically implausible oil temperatures never crash or corrupt output."""
    hot_weather = {"ambient_temperature": 40.0, "heatwave_alert": True}
    result = calculate_weather_factor(bad_temp, hot_weather)

    assert isinstance(result, dict)
    assert math.isfinite(result["weather_multiplier"])
    assert 1.0 <= result["weather_multiplier"] <= 1.5


# =============================================================================
# 15. NON-DICT WEATHER
# =============================================================================

@pytest.mark.parametrize("bad_weather", [None, [], "invalid", 12345])
def test_non_dict_weather_returns_safe_fallback(bad_weather):
    """Verify non-dictionary weather payloads return 1.0 multiplier and unavailable alert."""
    result = calculate_weather_factor(70.0, bad_weather)

    assert isinstance(result, dict)
    assert result["weather_multiplier"] == 1.0
    assert any("unavailable" in a.lower() or "not a dictionary" in a.lower() for a in result["weather_alerts"])


# =============================================================================
# 16. EMPTY WEATHER DICT
# =============================================================================

def test_empty_weather_dict():
    """Verify empty dictionary defaults to baseline multiplier with no alerts."""
    result = calculate_weather_factor(70.0, {})

    assert result["weather_multiplier"] == 1.0
    assert result["weather_alerts"] == []


# =============================================================================
# 17. BOOL VALUES IN NUMERIC FIELDS
# =============================================================================

def test_bool_values_do_not_distort_multipliers():
    """Verify booleans passed into numeric fields are safely rejected or handled."""
    weather = {
        "ambient_temperature": True,
        "wind_gust_speed": False,
        "lightning_activity": True,
    }
    result = calculate_weather_factor(True, weather)

    assert isinstance(result, dict)
    assert math.isfinite(result["weather_multiplier"])
    assert result["weather_multiplier"] == 1.0


# =============================================================================
# 18. MISSING FIELDS
# =============================================================================

def test_partially_populated_weather():
    """Verify safe behavior when only a subset of weather fields is present."""
    result = calculate_weather_factor(65.0, {"wind_gust_speed": 80.0})

    assert result["weather_multiplier"] == 1.08
    assert len(result["weather_alerts"]) == 1


# =============================================================================
# 19. COMPOUND SEVERE WEATHER
# =============================================================================

def test_compound_severe_weather():
    """Verify combined extreme hazards cap at 1.50 without duplicate alerts."""
    compound_weather = {
        "ambient_temperature": 45.0,
        "heatwave_alert": True,
        "wind_gust_speed": 115.0,
        "lightning_activity": 10.0,
        "storm_severity": "EXTREME",
    }
    result = calculate_weather_factor(112.0, compound_weather)

    assert result["weather_multiplier"] == 1.50
    assert len(result["weather_alerts"]) >= 5
    # Guarantee no duplicates
    assert len(result["weather_alerts"]) == len(set(result["weather_alerts"]))


# =============================================================================
# 20. MULTIPLIER BOUNDS INVARIANT
# =============================================================================

def test_multiplier_bounds_and_finiteness():
    """Verify that multiplier is strictly finite and clamped to [1.0, 1.5] across varied scenarios."""
    scenarios = [
        {},
        {"wind_gust_speed": 250.0},
        {"ambient_temperature": 60.0, "heatwave_alert": True},
        {"lightning_activity": 99.0, "storm_severity": "EXTREME"},
        {"wind_gust_speed": 500.0, "lightning_activity": 500.0, "ambient_temperature": 100.0},
    ]

    for sc in scenarios:
        res = calculate_weather_factor(80.0, sc)
        mult = res["weather_multiplier"]
        assert math.isfinite(mult)
        assert 1.0 <= mult <= 1.5


# =============================================================================
# 21. ALERT CONTRACT
# =============================================================================

def test_alert_contract():
    """Verify weather_alerts is always a list of unique strings."""
    weather = {
        "ambient_temperature": 43.0,
        "heatwave_alert": True,
        "wind_gust_speed": 80.0,
        "storm_severity": "WARNING",
    }
    result = calculate_weather_factor(95.0, weather)

    assert isinstance(result["weather_alerts"], list)
    for alert in result["weather_alerts"]:
        assert isinstance(alert, str)
        assert len(alert.strip()) > 0
    assert len(result["weather_alerts"]) == len(set(result["weather_alerts"]))


# =============================================================================
# 22. MONOTONICITY
# =============================================================================

def test_monotonicity_wind():
    """Verify increasing wind strictly does not decrease the weather multiplier."""
    winds = [0.0, 25.0, 50.0, 50.1, 75.0, 75.1, 100.0, 100.1, 150.0]
    multipliers = [calculate_weather_factor(60.0, {"wind_gust_speed": w})["weather_multiplier"] for w in winds]

    for i in range(len(multipliers) - 1):
        assert multipliers[i] <= multipliers[i + 1]


def test_monotonicity_lightning():
    """Verify increasing lightning strictly does not decrease the weather multiplier."""
    lights = [0.0, 2.0, 3.0, 5.0, 6.0, 8.0, 9.0, 10.0, 50.0]
    multipliers = [calculate_weather_factor(60.0, {"lightning_activity": l})["weather_multiplier"] for l in lights]

    for i in range(len(multipliers) - 1):
        assert multipliers[i] <= multipliers[i + 1]


# =============================================================================
# 23. DETERMINISM
# =============================================================================

def test_determinism():
    """Verify calling the function multiple times with identical arguments returns identical results."""
    weather = {
        "ambient_temperature": 39.0,
        "wind_gust_speed": 65.0,
        "lightning_activity": 5.0,
        "storm_severity": "WATCH",
        "heatwave_alert": True,
    }
    res1 = calculate_weather_factor(88.0, weather)
    res2 = calculate_weather_factor(88.0, weather)

    assert res1 == res2
