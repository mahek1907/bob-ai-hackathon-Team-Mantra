"""
Unit tests for GridSentinel AI - Real-Time Dynamic Risk Recalculation & Re-ranking
Module: tests/test_risk_recalculation.py
"""

import pytest
from src.services.telemetry_service import TelemetryService
from src.services.weather_service import WeatherService
from src.services.risk_service import RiskService


class TestRiskRecalculation:

    @pytest.fixture
    def setup_services(self):
        telem = TelemetryService()
        telem.load_initial_data()

        weather = WeatherService()
        # Initialize with fallback to ensure deterministic test baseline
        fallback = weather._load_fallback(40.7128, -74.0060)
        weather._cache["40.7128:-74.006"] = fallback
        weather._cache_timestamp = 9999999999

        risk = RiskService(telemetry_service=telem, weather_service=weather)
        risk.initialize()
        return telem, weather, risk

    def test_initial_fleet_ranking(self, setup_services):
        telem, weather, risk = setup_services
        state = risk.get_current_state()

        assert "ranked_assets" in state
        assert len(state["ranked_assets"]) >= 4
        # TX-401 has severe arcing in baseline data and should be top ranked
        top_asset = state["ranked_assets"][0]
        assert top_asset["asset_id"] == "TX-401"
        assert top_asset["risk_category"] == "CRITICAL"

    def test_dynamic_telemetry_drift_reorders_ranking(self, setup_services):
        telem, weather, risk = setup_services

        # Initially TX-205 is lowest risk (e.g. LOW risk, score ~22)
        initial_state = risk.get_current_state()
        tx205_initial = next(a for a in initial_state["ranked_assets"] if a["asset_id"] == "TX-205")
        assert tx205_initial["composite_risk_score"] < 40.0

        # Inject severe arcing fault and thermal runaway into TX-205
        severe_fault = {
            "asset_id": "TX-205",
            "oil_temperature": 118.0,
            "vibration": 11.5,
            "load_percent": 98.0,
            "dga_ppm": {
                "hydrogen": 800.0,
                "methane": 450.0,
                "ethane": 120.0,
                "ethylene": 650.0,
                "acetylene": 180.0  # extreme arcing
            }
        }
        telem.update_telemetry("TX-205", severe_fault)
        new_state = risk.recalculate()

        tx205_updated = next(a for a in new_state["ranked_assets"] if a["asset_id"] == "TX-205")
        assert tx205_updated["composite_risk_score"] >= 80.0
        assert tx205_updated["risk_category"] == "CRITICAL"

        # TX-205 should now jump to top of the ranking or tie for highest
        assert new_state["ranked_assets"][0]["asset_id"] in ["TX-205", "TX-401"]

    def test_weather_stress_compounding(self, setup_services):
        telem, weather, risk = setup_services

        # Baseline risk
        state1 = risk.get_current_state()
        score1 = state1["ranked_assets"][0]["composite_risk_score"]

        # Simulate severe storm event (high ambient, high gusts, heavy lightning)
        weather._cache["40.7128:-74.006"] = {
            "event_name": "Extreme Storm",
            "source": "Open-Meteo Test",
            "is_live": True,
            "ambient_temp_c": 44.0,
            "ambient_temperature": 44.0,
            "wind_speed_kmh": 120.0,
            "wind_gust_speed": 120.0,
            "lightning_strikes_last_hour": 90,
            "lightning_activity": 10.0,
            "storm_severity_index": 9.8,
            "storm_severity": "EXTREME",
            "heatwave_alert": True
        }
        weather._cache_timestamp = 9999999999

        state2 = risk.recalculate()
        score2 = state2["ranked_assets"][0]["composite_risk_score"]

        # Composite risk score should escalate under extreme weather stress
        assert score2 >= score1

    def test_risk_service_listener_notification(self, setup_services):
        telem, weather, risk = setup_services
        received_states = []

        risk.subscribe(lambda s: received_states.append(s))
        risk.recalculate()

        assert len(received_states) == 1
        assert "ranked_assets" in received_states[0]
        assert "summary" in received_states[0]

    def test_fleet_kpis_calculation(self, setup_services):
        telem, weather, risk = setup_services
        state = risk.get_current_state()
        summary = state["summary"]

        assert "total_monitored_assets" in summary
        assert summary["total_monitored_assets"] >= 4
        assert "critical_assets_count" in summary
        assert "high_risk_count" in summary
        assert "fleet_health_index" in summary
        assert 0 <= summary["fleet_health_index"] <= 100
