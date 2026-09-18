"""
Unit tests for GridSentinel AI - Offline Fallback & Graceful Degradation
Module: tests/test_offline_fallback.py
"""

import os
import pytest
from unittest.mock import patch
from src.services.telemetry_service import TelemetryService
from src.services.weather_service import WeatherService
from src.services.risk_service import RiskService
from src.services.mqtt_service import MQTTService
from src.work_order_generator import generate_granite_work_order


class TestOfflineFallback:

    def test_telemetry_service_initializes_from_json_when_offline(self):
        service = TelemetryService()
        service.load_initial_data()
        telemetry = service.get_all_telemetry()

        assert len(telemetry) >= 4
        for asset_id in ["TX-401", "TX-102", "TX-303", "TX-205"]:
            assert asset_id in telemetry
            assert telemetry[asset_id]["oil_temperature"] > 0
            assert "dga_ppm" in telemetry[asset_id]

    def test_weather_service_gracefully_degrades_when_api_unreachable(self):
        import requests
        service = WeatherService()

        with patch("requests.get", side_effect=requests.exceptions.RequestException("No Internet")):
            weather = service.get_current_weather(force_refresh=True)

            assert weather is not None
            assert weather["is_live"] is False
            assert "OFFLINE" in weather["source"].upper()
            assert weather["ambient_temp_c"] > 0
            assert weather["wind_speed_kmh"] > 0
            assert weather["lightning_strikes_last_hour"] >= 0

    def test_mqtt_service_does_not_crash_on_connection_failure(self):
        # Point to an invalid host / port with short timeout
        mqtt = MQTTService(broker_host="invalid-non-existent-host.local", broker_port=1883)
        # Starting should log an error/warning and not crash or throw unhandled exception
        mqtt.start()
        assert mqtt.is_connected is False
        mqtt.stop()

    def test_end_to_end_risk_pipeline_operates_offline(self):
        telem = TelemetryService()
        telem.load_initial_data()

        weather = WeatherService()
        # Force offline fallback
        fallback = weather._load_fallback(40.7128, -74.0060)
        weather._cache["40.7128:-74.006"] = fallback
        weather._cache_timestamp = 9999999999

        risk = RiskService(telemetry_service=telem, weather_service=weather)
        risk.initialize()

        state = risk.get_current_state()
        assert state is not None
        assert len(state["ranked_assets"]) >= 4

        top_asset = state["ranked_assets"][0]
        assert top_asset["composite_risk_score"] > 0
        assert top_asset["risk_category"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

        summary = state["summary"]
        assert summary["total_monitored_assets"] >= 4
        assert 0 <= summary["fleet_health_index"] <= 100

    def test_granite_work_order_generates_offline_template(self):
        # Force environment to have empty or demo keys
        with patch.dict(os.environ, {"WATSONX_API_KEY": "", "WATSONX_PROJECT_ID": ""}):
            dummy_asset = {
                "asset_id": "TX-401",
                "substation_name": "Metro Central Substation",
                "composite_risk_score": 97.5,
                "risk_category": "CRITICAL",
                "risk_factors": ["High-energy arcing (C2H2 = 85 ppm)"],
                "customers_served": 125000,
                "critical_infrastructure": ["Regional Metro Transit Rail"]
            }
            dummy_weather = {
                "event_name": "Tropical Storm Alex",
                "ambient_temp_c": 39.4,
                "wind_speed_kmh": 85.0
            }

            directive = generate_granite_work_order(dummy_asset, dummy_weather)
            assert directive is not None
            assert len(directive) > 100
            assert "OPERATIONAL PRE-POSITIONING DIRECTIVE" in directive
            assert "TX-401" in directive
            assert "Human-in-the-Loop" in directive
