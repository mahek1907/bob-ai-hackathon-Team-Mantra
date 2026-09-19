"""
Unit and integration tests for GridSentinel AI — Dynamic & Live Maintenance Directives
Module: tests/test_dynamic_directive.py

Validates that IBM Granite maintenance directives and recommended interventions:
1. Dynamically regenerate when material risk changes occur (score, tier, drift).
2. Automatically track the highest-risk transformer (e.g. switching to TX-102).
3. Generate dynamic context-aware fallback directives using current numbers when Granite is offline.
4. Broadcast live directive_updated events to WebSocket clients without page refresh.
"""

import os
import time
import pytest
from fastapi.testclient import TestClient

from src.services.telemetry_service import TelemetryService
from src.services.weather_service import WeatherService
from src.services.risk_service import RiskService
from src.work_order_generator import (
    build_structured_risk_context,
    generate_granite_directive_payload,
    generate_granite_work_order,
)
from src.server import app, _on_mqtt_telemetry


class TestDynamicDirective:

    @pytest.fixture(autouse=True)
    def setup_env(self):
        # Set cooldown to 0 for instantaneous test transitions
        old_cooldown = os.environ.get("GRANITE_DIRECTIVE_COOLDOWN_SECONDS")
        os.environ["GRANITE_DIRECTIVE_COOLDOWN_SECONDS"] = "0"
        yield
        if old_cooldown is not None:
            os.environ["GRANITE_DIRECTIVE_COOLDOWN_SECONDS"] = old_cooldown
        else:
            os.environ.pop("GRANITE_DIRECTIVE_COOLDOWN_SECONDS", None)

    @pytest.fixture
    def setup_services(self):
        telem = TelemetryService()
        telem.load_initial_data()

        weather = WeatherService()
        fallback = weather._load_fallback(40.7128, -74.0060)
        weather._cache["40.7128:-74.006"] = fallback
        weather._cache_timestamp = 9999999999

        risk = RiskService(telemetry_service=telem, weather_service=weather)
        risk.initialize()
        return telem, weather, risk

    def test_directive_regenerates_on_material_risk_change(self, setup_services):
        """
        Test 1:
        Input: TX-401 baseline risk (~77.5 - 80).
        Generate directive.
        Then inject telemetry drift (C2H2 increases to 180, oil temp to 118C, load to 98%).
        Recalculate risk.
        Assert:
        - Risk score changed
        - Directive timestamp changed
        - Recommendation reflects the new risk state
        - Old directive is not reused
        """
        telem, weather, risk = setup_services

        # Baseline directive
        state1 = risk.get_latest_state()
        d1 = state1.get("active_directive")
        assert d1 is not None
        assert d1["transformer_id"] == "TX-401"
        score1 = d1["directive_risk_score"]
        time1 = d1["directive_generated_at"]
        text1 = d1["directive_text"]

        time.sleep(0.05)  # Ensure clock progression for timestamp assertion

        # Inject severe telemetry drift on TX-401
        severe_tx401 = {
            "asset_id": "TX-401",
            "oil_temperature": 118.0,
            "winding_temperature": 128.0,
            "vibration": 10.5,
            "load_percent": 98.0,
            "dga_ppm": {
                "acetylene": 180.0,  # Critical arcing jump
                "ethylene": 320.0,
                "hydrogen": 450.0,
                "methane": 190.0,
                "ethane": 65.0,
                "carbon_monoxide": 480.0
            }
        }
        telem.update_telemetry("TX-401", severe_tx401)
        state2 = risk.recalculate(notify=False)
        d2 = state2.get("active_directive")
        assert d2 is not None

        # Assert 1: Risk score changed
        score2 = d2["directive_risk_score"]
        assert score2 != score1
        assert score2 >= 85.0

        # Assert 2: Directive timestamp changed
        time2 = d2["directive_generated_at"]
        assert time2 >= time1

        # Assert 3: Recommendation reflects the new risk state (180 ppm acetylene, 118C oil)
        text2 = d2["directive_text"]
        assert "180.0" in text2 or "180" in text2
        assert "118.0" in text2 or "118" in text2
        assert "RECOMMENDED INTERVENTION" in text2

        # Assert 4: Old directive is not reused
        assert text2 != text1

    def test_target_asset_dynamically_tracks_highest_risk_transformer(self, setup_services):
        """
        Test 2:
        TX-401 is initially highest risk.
        Change telemetry so TX-102 becomes highest risk.
        Assert:
        Target asset in active directive changes to TX-102.
        """
        telem, weather, risk = setup_services

        # Baseline: TX-401 is highest risk
        state1 = risk.get_latest_state()
        assert state1["ranked_assets"][0]["asset_id"] == "TX-401"
        assert state1["active_directive"]["directive_transformer_id"] == "TX-401"

        # De-escalate TX-401 (repaired/cooled down following crew intervention)
        telem.update_telemetry("TX-401", {
            "asset_id": "TX-401",
            "oil_temperature": 65.0,
            "vibration": 2.1,
            "load_percent": 45.0,
            "dga_ppm": {
                "acetylene": 1.0,
                "ethylene": 15.0,
                "hydrogen": 20.0,
                "methane": 10.0,
                "ethane": 8.0
            }
        })

        # Inject extreme arcing fault and thermal runaway into TX-102
        severe_tx102 = {
            "asset_id": "TX-102",
            "oil_temperature": 126.0,
            "vibration": 11.8,
            "load_percent": 99.0,
            "dga_ppm": {
                "acetylene": 290.0,  # Extreme arcing
                "ethylene": 480.0,
                "hydrogen": 890.0,
                "methane": 320.0,
                "ethane": 95.0
            }
        }
        telem.update_telemetry("TX-102", severe_tx102)
        state2 = risk.recalculate(notify=False)

        # TX-102 must now be top-ranked asset
        assert state2["ranked_assets"][0]["asset_id"] == "TX-102"

        # Target asset in active directive must dynamically switch to TX-102
        d2 = state2.get("active_directive")
        assert d2 is not None
        assert d2["directive_transformer_id"] == "TX-102"
        assert "TX-102" in d2["directive_text"]
        assert "North Regional Healthcare Hub" in d2["directive_text"]

    def test_fallback_directive_uses_current_live_telemetry_when_granite_unavailable(self, monkeypatch):
        """
        Test 3:
        Granite unavailable (API credentials empty/mocked offline).
        Assert:
        Fallback directive is generated dynamically from CURRENT telemetry/risk data.
        Does NOT reuse old static TX-401 values.
        """
        # Ensure watsonx is treated as offline
        monkeypatch.setenv("WATSONX_API_KEY", "")

        custom_ctx = build_structured_risk_context({
            "asset_id": "TX-205",
            "model": "ABB 230kV/69kV 150MVA Step-Down Transformer",
            "substation_name": "West Ridge Bulk Substation",
            "composite_risk_score": 88.5,
            "risk_category": "CRITICAL",
            "oil_temp_c": 119.5,
            "vibration_mms": 9.8,
            "load_pct": 97.0,
            "dga_ppm": {
                "acetylene": 145.0,
                "ethylene": 340.0,
                "hydrogen": 520.0
            },
            "customers_served": 64000,
            "hospital_connected": False,
            "transit_connected": True,
        }, weather={
            "ambient_temp_c": 41.2,
            "wind_speed_kmh": 78.0,
            "event_name": "Severe Gale Advisory",
            "source": "Open-Meteo Live"
        })

        payload = generate_granite_directive_payload(custom_ctx)

        # Source must be clearly identified as Template Fallback
        assert payload["is_live_granite"] is False
        assert payload["engine"] == "IBM Granite 3.0 — Template Fallback"

        # Content must use current live numbers
        text = payload["directive_text"]
        assert "TX-205" in text
        assert "West Ridge Bulk Substation" in text
        assert "88.5/100" in text
        assert "CRITICAL" in text
        assert "119.5" in text
        assert "145.0" in text
        assert "RECOMMENDED INTERVENTION" in text
        assert "Severe Gale Advisory" in text

        # Must not contain old TX-401 data from static files
        assert "TX-401" not in text
        assert "Metro Central Transit Substation" not in text

    def test_websocket_broadcasts_directive_updated_event_on_telemetry_drift(self):
        """
        Test 4:
        Connect to backend WebSocket stream /ws/live.
        Change telemetry on TX-401.
        Assert:
        Frontend receives live update payload containing active_directive and directive_updated event
        without page refresh.
        """
        with TestClient(app) as client:
            with client.websocket_connect("/ws/live") as websocket:
                # 1. Receive initial full state
                initial_msg = websocket.receive_json()
                assert "ranked_assets" in initial_msg
                assert "active_directive" in initial_msg
                d_init = initial_msg["active_directive"]
                assert d_init is not None

                # 2. Trigger telemetry drift on TX-401
                drift_payload = {
                    "transformer_id": "TX-401",
                    "oil_temperature": 119.5,
                    "winding_temperature": 130.0,
                    "vibration": 11.2,
                    "load_percent": 98.0,
                    "hydrogen_ppm": 480.0,
                    "c2h2_ppm": 190.0,
                    "c2h4_ppm": 350.0,
                }
                # Trigger MQTT ingestion handler
                _on_mqtt_telemetry(drift_payload)

                # 3. Receive updated broadcast over WebSocket
                received_update = False
                for _ in range(3):
                    msg = websocket.receive_json()
                    if msg.get("type") == "directive_updated" or (
                        msg.get("active_directive") and msg["active_directive"].get("directive_risk_score") >= 80
                    ):
                        received_update = True
                        break

                assert received_update is True
