"""
Unit tests for GridSentinel AI - Real-Time SCADA/Sensor Telemetry & MQTT Ingestion
Module: tests/test_mqtt_telemetry.py
"""

import json
import pytest
from src.services.telemetry_service import TelemetryService
from src.services.mqtt_service import MQTTService


class DummyMQTTMessage:
    """Mock MQTT message object."""
    def __init__(self, topic: str, payload: bytes):
        self.topic = topic
        self.payload = payload


class TestTelemetryService:

    @pytest.fixture
    def telemetry_service(self):
        service = TelemetryService()
        service.load_initial_data()
        return service

    def test_initial_data_loaded(self, telemetry_service):
        all_telemetry = telemetry_service.get_all_telemetry()
        assert len(all_telemetry) >= 4
        assert "TX-401" in all_telemetry
        assert "TX-102" in all_telemetry

    def test_update_telemetry_standard_fields(self, telemetry_service):
        payload = {
            "asset_id": "TX-401",
            "oil_temperature": 99.5,
            "vibration": 7.2,
            "load_percent": 91.0,
            "dga_ppm": {
                "hydrogen": 420.0,
                "methane": 180.0,
                "ethane": 70.0,
                "ethylene": 220.0,
                "acetylene": 65.0
            }
        }
        updated = telemetry_service.update_telemetry("TX-401", payload)
        assert updated is not None
        assert updated["oil_temperature"] == 99.5
        assert updated["vibration"] == 7.2
        assert updated["load_percent"] == 91.0
        assert updated["dga_ppm"]["acetylene"] == 65.0
        assert updated["is_live"] is True

    def test_schema_aliases_mapping(self, telemetry_service):
        payload = {
            "transformer_id": "TX-102",
            "oil_temp_c": 84.5,
            "vibration_mms": 4.2,
            "load_pct": 74.0,
            "dga_ppm": {
                "c2h2": 15.0,
                "ch4": 125.0,
                "h2": 95.0,
                "c2h4": 65.0,
                "c2h6": 28.0
            }
        }
        updated = telemetry_service.update_telemetry("TX-102", payload)
        assert updated["oil_temperature"] == 84.5
        assert updated["vibration"] == 4.2
        assert updated["load_percent"] == 74.0
        assert updated["dga_ppm"]["acetylene"] == 15.0
        assert updated["dga_ppm"]["methane"] == 125.0
        assert updated["dga_ppm"]["hydrogen"] == 95.0

    def test_range_clamping_and_validation(self, telemetry_service):
        payload = {
            "oil_temperature": 250.0,  # exceeds max 200.0
            "vibration": -5.0,         # below min 0.0
            "load_percent": 450.0,     # exceeds max 300.0
            "dga_ppm": {
                "acetylene": -10.0      # below min 0.0
            }
        }
        updated = telemetry_service.update_telemetry("TX-303", payload)
        assert updated["oil_temperature"] == 200.0
        assert updated["vibration"] == 0.0
        assert updated["load_percent"] == 300.0
        assert updated["dga_ppm"]["acetylene"] == 0.0

    def test_missing_asset_id_fallback(self, telemetry_service):
        payload = {
            "oil_temperature": 75.0
        }
        updated = telemetry_service.update_telemetry("TX-205", payload)
        assert updated["oil_temperature"] == 75.0

    def test_listener_callback_triggered(self, telemetry_service):
        notified = []

        def listener(asset_id, data):
            notified.append((asset_id, data))

        telemetry_service.subscribe(listener)
        telemetry_service.update_telemetry("TX-401", {"oil_temperature": 105.0})

        assert len(notified) == 1
        assert notified[0][0] == "TX-401"
        assert notified[0][1]["oil_temperature"] == 105.0


class TestMQTTServiceResilience:

    @pytest.fixture
    def setup_services(self):
        telem_service = TelemetryService()
        telem_service.load_initial_data()
        mqtt = MQTTService(broker_host="broker.hivemq.com", broker_port=1883)
        return telem_service, mqtt

    def test_mqtt_parses_valid_json(self, setup_services):
        telem_service, mqtt = setup_services
        received = []

        def callback(data):
            received.append(data)

        mqtt.add_callback(callback)

        topic = "grid/transformers/TX-401/telemetry"
        payload = json.dumps({"oil_temperature": 94.2, "vibration": 5.8}).encode("utf-8")
        msg = DummyMQTTMessage(topic, payload)

        mqtt._on_message(None, None, msg)

        assert len(received) == 1
        assert received[0].get("transformer_id") == "TX-401"
        assert received[0]["oil_temperature"] == 94.2

    def test_mqtt_handles_malformed_json_gracefully(self, setup_services):
        telem_service, mqtt = setup_services
        received = []
        mqtt.add_callback(lambda d: received.append(d))

        topic = "grid/transformers/TX-401/telemetry"
        msg = DummyMQTTMessage(topic, b"INVALID_CORRUPTED_JSON{{{")

        # Must not raise an unhandled exception
        mqtt._on_message(None, None, msg)
        assert len(received) == 0

    def test_mqtt_handles_unknown_topic_structure(self, setup_services):
        telem_service, mqtt = setup_services
        received = []
        mqtt.add_callback(lambda d: received.append(d))

        topic = "random/unknown/topic"
        msg = DummyMQTTMessage(topic, b'{"test": 123}')

        mqtt._on_message(None, None, msg)
        assert len(received) == 0
