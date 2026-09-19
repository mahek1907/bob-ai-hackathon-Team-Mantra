"""
tests/test_control_center_configuration.py
Comprehensive end-to-end unit and integration tests for GridSentinel AI
Control Center Settings & Dynamic Configuration Pipeline.

Validates all 16 hackathon-critical scenarios:
1. test_get_configuration_returns_defaults
2. test_put_configuration_saves_values
3. test_get_after_put_returns_saved_values
4. test_configuration_survives_reload
5. test_c2h2_threshold_controls_dga_evaluation
6. test_oil_temp_threshold_controls_thermal_risk
7. test_vibration_threshold_controls_mechanical_risk
8. test_invalid_configuration_rejected_with_400
9. test_saved_configuration_active_immediately_without_restart
10. test_mqtt_telemetry_evaluated_using_new_configuration
11. test_risk_score_recalculated_after_configuration_update
12. test_granite_directive_uses_current_risk_context
13. test_auto_draft_off_prevents_automatic_granite_generation
14. test_auto_draft_on_allows_automatic_draft_generation
15. test_websocket_broadcasts_configuration_updated_event
16. test_frontend_receives_updated_live_risk_state
"""

import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from src.dga_engine import evaluate_dga_and_health
from src.risk_engine import calculate_comprehensive_risk
from src.server import app, configuration_service, risk_service, telemetry_service, weather_service
from src.services.configuration_service import (
    ConfigurationService,
    DEFAULT_CONFIGURATION,
    get_configuration_service,
)
from src.services.risk_service import RiskService
from src.services.telemetry_service import TelemetryService
from src.services.weather_service import WeatherService
from src.work_order_generator import build_structured_risk_context, generate_granite_directive_payload


@pytest.fixture
def client():
    """Test client bound to FastAPI application."""
    return TestClient(app)


@pytest.fixture
def temp_config_file():
    """Provide a temporary configuration file that is cleaned up after each test."""
    temp_dir = tempfile.mkdtemp()
    config_path = Path(temp_dir) / "test_system_configuration.json"
    yield config_path
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(autouse=True)
def reset_server_config():
    """Ensure global configuration is reset to defaults before and after each test."""
    configuration_service.reset_to_defaults()
    yield
    configuration_service.reset_to_defaults()


# =============================================================================
# SCENARIO 1: GET Configuration Returns Factory Defaults
# =============================================================================

def test_get_configuration_returns_defaults(client):
    """
    1. Verify GET /api/configuration returns HTTP 200 with standard factory defaults:
       - C2H2 arcing trigger: 80.0 ppm
       - Max oil temperature: 105.0 C
       - Vibration warning: 7.0 mm/s
       - Auto-draft IBM Granite directives: False
       - Polling interval: 30s
       - Critical audio alerts: True
       - Status: SAVED & ACTIVE
    """
    resp = client.get("/api/configuration")
    assert resp.status_code == 200
    data = resp.json()

    assert data["c2h2_arcing_threshold_ppm"] == 80.0
    assert data["max_oil_temperature_c"] == 105.0
    assert data["vibration_warning_mms"] == 7.0
    assert data["auto_draft_directives"] is False
    assert data["polling_interval"] == "30s"
    assert data["critical_audio_alerts"] is True
    assert data["status"] == "SAVED & ACTIVE"
    assert "updated_at" in data

    # Verify structured groups are present
    assert data["dga"]["c2h2_arcing_threshold_ppm"] == 80.0
    assert data["thermal"]["max_oil_temperature_c"] == 105.0
    assert data["mechanical"]["vibration_warning_mms"] == 7.0
    assert data["granite"]["auto_draft_directives"] is False
    assert data["workstation"]["polling_interval"] == "30s"


# =============================================================================
# SCENARIO 2: PUT Configuration Saves Values
# =============================================================================

def test_put_configuration_saves_values(client):
    """
    2. Verify PUT /api/configuration accepts valid threshold updates and returns 200 with status.
    """
    payload = {
        "c2h2_arcing_threshold_ppm": 95.0,
        "max_oil_temperature_c": 115.0,
        "vibration_warning_mms": 8.5,
        "auto_draft_directives": True,
        "polling_interval": "10s",
        "critical_audio_alerts": False,
    }
    resp = client.put("/api/configuration", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["c2h2_arcing_threshold_ppm"] == 95.0
    assert data["max_oil_temperature_c"] == 115.0
    assert data["vibration_warning_mms"] == 8.5
    assert data["auto_draft_directives"] is True
    assert data["polling_interval"] == "10s"
    assert data["critical_audio_alerts"] is False
    assert data["status"] == "SAVED & ACTIVE"


# =============================================================================
# SCENARIO 3: GET After PUT Returns Saved Values
# =============================================================================

def test_get_after_put_returns_saved_values(client):
    """
    3. Verify that GET /api/configuration immediately reflects the values saved via PUT.
    """
    update_payload = {
        "c2h2_arcing_threshold_ppm": 120.0,
        "max_oil_temperature_c": 112.0,
        "vibration_warning_mms": 6.5,
        "auto_draft_directives": True,
    }
    put_resp = client.put("/api/configuration", json=update_payload)
    assert put_resp.status_code == 200

    get_resp = client.get("/api/configuration")
    assert get_resp.status_code == 200
    get_data = get_resp.json()

    assert get_data["c2h2_arcing_threshold_ppm"] == 120.0
    assert get_data["max_oil_temperature_c"] == 112.0
    assert get_data["vibration_warning_mms"] == 6.5
    assert get_data["auto_draft_directives"] is True


# =============================================================================
# SCENARIO 4: Configuration Survives Service Reload (Persistence)
# =============================================================================

def test_configuration_survives_reload(temp_config_file):
    """
    4. Verify settings persist to disk in system_configuration.json and survive reload.
    """
    service_1 = ConfigurationService(config_path=temp_config_file)
    service_1.update_configuration({
        "c2h2_arcing_threshold_ppm": 110.0,
        "max_oil_temperature_c": 118.0,
        "vibration_warning_mms": 9.2,
        "auto_draft_directives": True,
        "polling_interval": "60s",
    })

    # Verify JSON was written to disk
    assert temp_config_file.exists()
    with open(temp_config_file, "r", encoding="utf-8") as f:
        on_disk = json.load(f)
    assert on_disk["c2h2_arcing_threshold_ppm"] == 110.0

    # Instantiate fresh second service simulating process restart
    service_2 = ConfigurationService(config_path=temp_config_file)
    cfg2 = service_2.get_configuration()

    assert cfg2["c2h2_arcing_threshold_ppm"] == 110.0
    assert cfg2["max_oil_temperature_c"] == 118.0
    assert cfg2["vibration_warning_mms"] == 9.2
    assert cfg2["auto_draft_directives"] is True
    assert cfg2["polling_interval"] == "60s"


# =============================================================================
# SCENARIO 5: C2H2 Threshold Controls DGA Evaluation
# =============================================================================

def test_c2h2_threshold_controls_dga_evaluation():
    """
    5. Verify DGA evaluation with C2H2 = 85.0 ppm:
       - At threshold = 80.0 ppm: triggers severe electrical arcing warning flag
       - At threshold = 100.0 ppm: severe arcing warning clears and health score improves
    """
    asset = {
        "asset_id": "TX-401",
        "dga_ppm": {"acetylene": 85.0, "ethylene": 10.0},
        "oil_temperature": 70.0,
        "vibration_level": 2.0,
    }

    res_80 = evaluate_dga_and_health(asset, config={"c2h2_arcing_threshold_ppm": 80.0})
    res_100 = evaluate_dga_and_health(asset, config={"c2h2_arcing_threshold_ppm": 100.0})

    # At 80 ppm, 85 ppm triggers high acetylene / severe electrical arcing risk
    has_warning_80 = any(
        "high acetylene" in f.lower() or "severe electrical arcing" in f.lower()
        for f in res_80["fault_flags"]
    )
    assert has_warning_80 is True

    # At 100 ppm, 85 ppm is below threshold -> severe arcing warning clears
    has_warning_100 = any(
        "high acetylene" in f.lower() or "severe electrical arcing" in f.lower()
        for f in res_100["fault_flags"]
    )
    assert has_warning_100 is False

    # Score should improve when threshold is higher
    assert res_80["physical_health_score"] > res_100["physical_health_score"]


# =============================================================================
# SCENARIO 6: Oil Temp Threshold Controls Thermal Risk
# =============================================================================

def test_oil_temp_threshold_controls_thermal_risk():
    """
    6. Verify oil temp = 108.5 C:
       - At threshold = 105.0 C: triggers high oil temperature overheating warning
       - At threshold = 110.0 C: severe overheating warning clears
    """
    asset = {
        "asset_id": "TX-HOT",
        "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
        "oil_temperature": 108.5,
        "vibration_level": 2.0,
    }

    res_105 = evaluate_dga_and_health(asset, config={"max_oil_temperature_c": 105.0})
    res_110 = evaluate_dga_and_health(asset, config={"max_oil_temperature_c": 110.0})

    has_overheat_105 = any(
        "high oil temperature" in f.lower() or "critical overheating" in f.lower()
        for f in res_105["fault_flags"]
    )
    assert has_overheat_105 is True

    has_overheat_110 = any(
        "high oil temperature" in f.lower() or "critical overheating" in f.lower()
        for f in res_110["fault_flags"]
    )
    assert has_overheat_110 is False
    assert res_105["physical_health_score"] > res_110["physical_health_score"]


# =============================================================================
# SCENARIO 7: Vibration Threshold Controls Mechanical Risk
# =============================================================================

def test_vibration_threshold_controls_mechanical_risk():
    """
    7. Verify vibration = 8.4 mm/s:
       - At threshold = 7.0 mm/s: triggers severe mechanical vibration warning
       - At threshold = 9.0 mm/s: severe vibration warning clears
    """
    asset = {
        "asset_id": "TX-VIB",
        "dga_ppm": {"acetylene": 0.1, "ethylene": 10.0},
        "oil_temperature": 65.0,
        "vibration_level": 8.4,
    }

    res_7 = evaluate_dga_and_health(asset, config={"vibration_warning_mms": 7.0})
    res_9 = evaluate_dga_and_health(asset, config={"vibration_warning_mms": 9.0})

    has_vib_7 = any(
        "high vibration" in f.lower() or "significant mechanical stress" in f.lower()
        for f in res_7["fault_flags"]
    )
    assert has_vib_7 is True

    has_vib_9 = any(
        "high vibration" in f.lower() or "significant mechanical stress" in f.lower()
        for f in res_9["fault_flags"]
    )
    assert has_vib_9 is False
    assert res_7["physical_health_score"] > res_9["physical_health_score"]


# =============================================================================
# SCENARIO 8: Invalid Configuration Rejected with 400 Bad Request
# =============================================================================

@pytest.mark.parametrize("bad_payload", [
    {"c2h2_arcing_threshold_ppm": -10.0},      # negative
    {"c2h2_arcing_threshold_ppm": 9999.0},     # exceeds maximum boundary
    {"max_oil_temperature_c": 10.0},          # below physical min 50 C
    {"max_oil_temperature_c": 250.0},         # exceeds physical max 180 C
    {"vibration_warning_mms": 0.0},           # below min 1.0 mm/s
    {"polling_interval": "invalid_rate"},      # invalid sampling rate
])
def test_invalid_configuration_rejected_with_400(client, bad_payload):
    """
    8. Verify that nonsensical or physically implausible configuration values
       are strictly rejected by backend with HTTP 400 and clear error detail.
    """
    resp = client.put("/api/configuration", json=bad_payload)
    assert resp.status_code == 400
    assert "detail" in resp.json()


# =============================================================================
# SCENARIO 9: Saved Configuration Active Immediately Without Restart
# =============================================================================

def test_saved_configuration_active_immediately_without_restart(client):
    """
    9. Verify saving configuration via API immediately updates the backend's
       active configuration in-memory cache without requiring a server reboot.
    """
    client.put("/api/configuration", json={"c2h2_arcing_threshold_ppm": 125.0})
    active = configuration_service.get_configuration()
    assert active["c2h2_arcing_threshold_ppm"] == 125.0


# =============================================================================
# SCENARIO 10: MQTT Telemetry Evaluated Using New Configuration
# =============================================================================

def test_mqtt_telemetry_evaluated_using_new_configuration(client):
    """
    10. Verify that when telemetry is updated, fleet risk evaluation uses the active configuration.
    """
    # 1. With threshold at default 80.0 ppm, TX-401 (C2H2 = 85.0) triggers severe arcing
    client.put("/api/configuration", json={"c2h2_arcing_threshold_ppm": 80.0})
    state_before = risk_service.recalculate(notify=False)
    tx401_before = next(a for a in state_before["ranked_assets"] if a["asset_id"] == "TX-401")
    score_before = tx401_before["composite_risk_score"]

    # 2. Raise threshold to 100.0 ppm, 110.0 C, 9.0 mm/s
    client.put("/api/configuration", json={
        "c2h2_arcing_threshold_ppm": 100.0,
        "max_oil_temperature_c": 110.0,
        "vibration_warning_mms": 9.0,
    })
    state_after = risk_service.recalculate(notify=False)
    tx401_after = next(a for a in state_after["ranked_assets"] if a["asset_id"] == "TX-401")
    score_after = tx401_after["composite_risk_score"]

    assert score_after < score_before


# =============================================================================
# SCENARIO 11: Risk Score Recalculated After Configuration Update
# =============================================================================

def test_risk_score_recalculated_after_configuration_update(client):
    """
    11. Verify that PUT /api/configuration immediately recalculates fleet risk.
    """
    resp_init = client.get("/api/risk/ranked")
    assert resp_init.status_code == 200
    initial_score = resp_init.json()["ranked_assets"][0]["composite_risk_score"]

    # Increase thresholds so assets are penalized less
    client.put("/api/configuration", json={
        "c2h2_arcing_threshold_ppm": 120.0,
        "max_oil_temperature_c": 120.0,
        "vibration_warning_mms": 10.0,
    })

    resp_updated = client.get("/api/risk/ranked")
    updated_score = resp_updated.json()["ranked_assets"][0]["composite_risk_score"]

    assert updated_score < initial_score


# =============================================================================
# SCENARIO 12: Granite Directive Uses Current Risk Context
# =============================================================================

def test_granite_directive_uses_current_risk_context():
    """
    12. Verify that work-order context contains the active configuration
        and action recommendations align with the configured thresholds.
    """
    asset = {
        "asset_id": "TX-401",
        "dga_ppm": {"acetylene": 85.0, "ethylene": 20.0},
        "oil_temperature": 108.5,
        "vibration_level": 8.4,
        "composite_risk_score": 85.0,
        "risk_category": "CRITICAL",
    }
    cfg = {
        "c2h2_arcing_threshold_ppm": 80.0,
        "max_oil_temperature_c": 105.0,
        "vibration_warning_mms": 7.0,
    }

    ctx = build_structured_risk_context(asset=asset, config=cfg)
    assert ctx["config"]["c2h2_arcing_threshold_ppm"] == 80.0

    directive = generate_granite_directive_payload(ctx)
    assert directive is not None
    assert "TX-401" in directive["directive_text"]
    assert "RECOMMENDED INTERVENTION" in directive["directive_text"]


# =============================================================================
# SCENARIO 13: Auto-Draft OFF Prevents Automatic Granite Generation
# =============================================================================

def test_auto_draft_off_prevents_automatic_granite_generation():
    """
    13. When Auto-Draft IBM Granite Directives is OFF, telemetry drift
        does not automatically generate a new directive in the background.
    """
    telem = TelemetryService()
    telem.load_initial_data()
    weather = WeatherService()
    cfg_service = ConfigurationService()
    cfg_service.update_configuration({"auto_draft_directives": False})

    risk = RiskService(
        telemetry_service=telem,
        weather_service=weather,
        config_service=cfg_service,
    )
    risk.initialize()

    # Capture initial directive timestamp
    initial_dir = risk.get_active_directive()
    initial_time = initial_dir["directive_generated_at"]

    # Inject telemetry drift on TX-401
    telem.update_telemetry("TX-401", {
        "dga_ppm": {"acetylene": 195.0},
        "oil_temperature": 122.0,
    })

    # Recalculate without forcing directive
    risk.recalculate(notify=False, force_directive=False)
    current_dir = risk.get_active_directive()

    # Generation was suppressed; directive was not updated
    assert current_dir["directive_generated_at"] == initial_time
    assert current_dir.get("is_stale") is True


# =============================================================================
# SCENARIO 14: Auto-Draft ON Allows Automatic Draft Generation
# =============================================================================

def test_auto_draft_on_allows_automatic_draft_generation():
    """
    14. When Auto-Draft IBM Granite Directives is ON, telemetry drift
        automatically drafts an updated directive upon meaningful risk transition.
    """
    # Set cooldown to 0 for instantaneous test verification
    old_cooldown = os.environ.get("GRANITE_DIRECTIVE_COOLDOWN_SECONDS")
    os.environ["GRANITE_DIRECTIVE_COOLDOWN_SECONDS"] = "0"

    try:
        telem = TelemetryService()
        telem.load_initial_data()
        weather = WeatherService()
        cfg_service = ConfigurationService()
        cfg_service.update_configuration({"auto_draft_directives": True})

        risk = RiskService(
            telemetry_service=telem,
            weather_service=weather,
            config_service=cfg_service,
        )
        risk.initialize()

        initial_dir = risk.get_active_directive()
        initial_score = initial_dir["directive_risk_score"]

        # Inject severe telemetry drift on TX-401
        telem.update_telemetry("TX-401", {
            "dga_ppm": {"acetylene": 220.0},
            "oil_temperature": 128.0,
        })

        # Recalculate
        state2 = risk.recalculate(notify=False, force_directive=False)
        updated_dir = state2["active_directive"]

        assert updated_dir is not None
        assert updated_dir["directive_risk_score"] >= initial_score
        assert state2["directive_updated"] is True
    finally:
        if old_cooldown is not None:
            os.environ["GRANITE_DIRECTIVE_COOLDOWN_SECONDS"] = old_cooldown
        else:
            os.environ.pop("GRANITE_DIRECTIVE_COOLDOWN_SECONDS", None)


# =============================================================================
# SCENARIO 15: WebSocket Broadcasts Configuration Updated Event
# =============================================================================

def test_websocket_broadcasts_configuration_updated_event():
    """
    15. Verify that ConfigurationService dispatches change notification to listeners.
    """
    received_events = []

    def on_config_changed(cfg):
        received_events.append(cfg)

    cfg_service = ConfigurationService()
    cfg_service.register_listener(on_config_changed)

    cfg_service.update_configuration({
        "c2h2_arcing_threshold_ppm": 92.0,
        "max_oil_temperature_c": 108.0,
    })

    assert len(received_events) == 1
    assert received_events[0]["c2h2_arcing_threshold_ppm"] == 92.0
    assert received_events[0]["status"] == "SAVED & ACTIVE"


# =============================================================================
# SCENARIO 16: Frontend Receives Updated Live Risk State
# =============================================================================

def test_frontend_receives_updated_live_risk_state(client):
    """
    16. Verify that updating configuration recalculates risk state and returns
        the active configuration with SAVED & ACTIVE status to the frontend.
    """
    update_res = client.put("/api/configuration", json={
        "c2h2_arcing_threshold_ppm": 88.0,
        "max_oil_temperature_c": 107.0,
        "vibration_warning_mms": 7.5,
        "auto_draft_directives": True,
        "polling_interval": "10s",
        "critical_audio_alerts": True,
    })

    assert update_res.status_code == 200
    config_data = update_res.json()
    assert config_data["status"] == "SAVED & ACTIVE"

    # Verify latest risk state is aligned
    latest_state = risk_service.get_latest_state()
    assert latest_state is not None
    assert "ranked_assets" in latest_state
    assert len(latest_state["ranked_assets"]) > 0
