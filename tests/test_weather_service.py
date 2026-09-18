"""
Unit tests for GridSentinel AI - Open-Meteo Weather Service & Fallback
Module: tests/test_weather_service.py
"""

import pytest
from unittest.mock import patch, MagicMock
from src.services.weather_service import WeatherService


class TestWeatherService:

    @pytest.fixture
    def weather_service(self):
        return WeatherService()

    def test_mock_open_meteo_successful_parse(self, weather_service):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "current": {
                "time": "2026-09-18T12:00",
                "temperature_2m": 38.5,
                "relative_humidity_2m": 72.0,
                "precipitation": 14.5,
                "weather_code": 95,  # Thunderstorm
                "surface_pressure": 998.2,
                "wind_speed_10m": 62.0,
                "wind_gusts_10m": 88.0
            }
        }

        with patch("requests.get", return_value=mock_response):
            data = weather_service.get_current_weather(force_refresh=True)

            assert data["is_live"] is True
            assert "OPEN_METEO" in data["source"].upper()
            assert data["ambient_temp_c"] == 38.5
            assert data["wind_speed_kmh"] == 88.0  # uses peak gusts
            assert data["relative_humidity_pct"] == 72.0
            assert data["precipitation_mm"] == 14.5
            assert data["surface_pressure_hpa"] == 998.2
            assert data["lightning_strikes_last_hour"] > 0
            assert data["heatwave_alert"] is True  # > 35°C
            assert data["storm_severity_index"] >= 7.0

    def test_caching_within_ttl(self, weather_service):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "current": {
                "temperature_2m": 30.0,
                "wind_gusts_10m": 45.0,
                "weather_code": 3,
                "precipitation": 0.0
            }
        }

        with patch("requests.get", return_value=mock_response) as mock_get:
            res1 = weather_service.get_current_weather(force_refresh=True)
            res2 = weather_service.get_current_weather(force_refresh=False)

            assert res1["ambient_temp_c"] == 30.0
            assert res2["ambient_temp_c"] == 30.0
            # requests.get should only have been called once due to caching
            assert mock_get.call_count == 1

    def test_network_failure_returns_offline_fallback(self, weather_service):
        import requests
        with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Network unreachable")):
            data = weather_service.get_current_weather(force_refresh=True)

            assert data is not None
            assert data["is_live"] is False
            assert "OFFLINE" in data["source"].upper()
            # Fallback contains calibrated demo storm data
            assert data["ambient_temp_c"] > 0
            assert data["wind_speed_kmh"] > 0
            assert data["lightning_strikes_last_hour"] >= 0

    def test_http_error_returns_offline_fallback(self, weather_service):
        mock_response = MagicMock()
        mock_response.status_code = 503
        with patch("requests.get", return_value=mock_response):
            data = weather_service.get_current_weather(force_refresh=True)

            assert data["is_live"] is False
            assert "OFFLINE" in data["source"].upper()

    def test_substation_weather_coordinates(self, weather_service):
        substations = [
            {"substation_id": "SUB-METRO-09", "latitude": 40.7128, "longitude": -74.0060},
            {"substation_id": "SUB-NORTH-01", "latitude": 40.7589, "longitude": -73.9851}
        ]
        results = weather_service.get_substations_weather(substations)
        assert len(results) == 2
        assert "SUB-METRO-09" in results
        assert "SUB-NORTH-01" in results
