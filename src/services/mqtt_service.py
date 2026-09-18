"""
GridSentinel AI — MQTT Real-Time Telemetry Streaming Service
Module: src/services/mqtt_service.py

Ingests real-time simulated SCADA telemetry published from transformers
via MQTT (HiveMQ Cloud or public/local broker). Normalizes messages,
updates the telemetry state registry, and triggers risk recalculations.

DISCLAIMER:
Labeled internally as "Real-time simulated transformer sensor/SCADA telemetry"
for hackathon demonstration purposes.
"""

from __future__ import annotations

import json
import logging
import os
import ssl
import time
from typing import Any, Callable, Dict, Optional

import paho.mqtt.client as mqtt

logger = logging.getLogger("grid_sentinel.mqtt_service")

DEFAULT_BROKER_HOST = "broker.hivemq.com"
DEFAULT_BROKER_PORT = 1883
DEFAULT_TOPIC_PREFIX = "grid/transformers"


class MqttService:
    """MQTT Client subscribing to transformer telemetry topics."""

    def __init__(
        self,
        on_telemetry_received: Optional[Callable[[Dict[str, Any]], None]] = None,
        broker_host: Optional[str] = None,
        broker_port: Optional[int] = None,
    ):
        self.host = (broker_host or os.getenv("MQTT_BROKER_HOST", DEFAULT_BROKER_HOST)).strip()
        self.port = broker_port or int(os.getenv("MQTT_BROKER_PORT", str(DEFAULT_BROKER_PORT)))
        self.username = os.getenv("MQTT_USERNAME", "").strip()
        self.password = os.getenv("MQTT_PASSWORD", "").strip()
        self.use_tls = os.getenv("MQTT_USE_TLS", "false").strip().lower() in ("true", "1", "yes") or (self.port == 8883)
        self.topic_prefix = os.getenv("MQTT_TOPIC_PREFIX", DEFAULT_TOPIC_PREFIX).strip().rstrip("/")

        self.on_telemetry_received = on_telemetry_received
        self._callbacks: list[Callable[[Dict[str, Any]], None]] = []

        self._client: Optional[mqtt.Client] = None
        self._is_connected: bool = False
        self._connection_status: str = "INITIALIZING"
        self._messages_count: int = 0
        self._last_message_time: Optional[float] = None

    def add_callback(self, callback: Callable[[Dict[str, Any]], None]) -> None:
        """Register an additional callback listener for received telemetry."""
        self._callbacks.append(callback)

    def start(self) -> None:
        """Initialize and start background MQTT client connection loop."""
        client_id = f"gridsentinel-backend-{int(time.time())}"

        # Support both Paho v2 and v1 cleanly
        try:
            if hasattr(mqtt, "CallbackAPIVersion"):
                self._client = mqtt.Client(
                    mqtt.CallbackAPIVersion.VERSION2,
                    client_id=client_id,
                    clean_session=True
                )
            else:
                self._client = mqtt.Client(client_id=client_id, clean_session=True)
        except Exception:
            self._client = mqtt.Client(client_id=client_id, clean_session=True)

        if self.username and self.password:
            self._client.username_pw_set(self.username, self.password)

        if self.use_tls:
            try:
                self._client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
            except Exception as e:
                logger.warning(f"Failed to enable TLS on MQTT client: {e}")

        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        try:
            logger.info(f"Connecting to MQTT broker at {self.host}:{self.port} (TLS: {self.use_tls})...")
            self._connection_status = "CONNECTING"
            self._client.connect_async(self.host, self.port, keepalive=60)
            self._client.loop_start()
        except Exception as e:
            self._is_connected = False
            self._connection_status = f"OFFLINE ({str(e)})"
            logger.warning(f"Could not connect to MQTT broker ({e}). Offline demo fallback will be active.")

    def stop(self) -> None:
        """Stop MQTT client and background loop."""
        if self._client:
            try:
                self._client.loop_stop()
                self._client.disconnect()
            except Exception:
                pass
            self._is_connected = False
            self._connection_status = "STOPPED"

    def _on_connect(self, client: Any, userdata: Any, flags: Any, rc_or_reason: Any, *args: Any) -> None:
        """Handle MQTT broker connection established."""
        rc = rc_or_reason if isinstance(rc_or_reason, int) else getattr(rc_or_reason, "value", 0)

        if rc == 0:
            self._is_connected = True
            self._connection_status = "CONNECTED"
            logger.info(f"Connected to MQTT broker {self.host}:{self.port}")

            # Subscribe to transformer telemetry topics
            topic_pattern = f"{self.topic_prefix}/+/telemetry"
            client.subscribe(topic_pattern)
            client.subscribe(f"{self.topic_prefix}/#")
            logger.info(f"Subscribed to MQTT topic: {topic_pattern}")
        else:
            self._is_connected = False
            self._connection_status = f"FAILED_RC_{rc}"
            logger.warning(f"MQTT connection refused with code {rc}")

    def _on_disconnect(self, client: Any, userdata: Any, *args: Any) -> None:
        """Handle MQTT broker disconnect event."""
        self._is_connected = False
        self._connection_status = "DISCONNECTED"
        logger.info("Disconnected from MQTT broker.")

    def _on_message(self, client: Any, userdata: Any, msg: Any) -> None:
        """Process incoming MQTT message containing simulated sensor telemetry."""
        try:
            self._messages_count += 1
            self._last_message_time = time.time()

            payload_str = msg.payload.decode("utf-8")
            data = json.loads(payload_str)

            if not isinstance(data, dict):
                logger.warning(f"Ignoring non-dict MQTT payload from topic {msg.topic}")
                return

            # Extract transformer ID from topic if missing in payload
            if "transformer_id" not in data and "asset_id" not in data:
                topic_parts = msg.topic.split("/")
                if len(topic_parts) >= 3 and topic_parts[-1] == "telemetry":
                    data["transformer_id"] = topic_parts[-2]
                else:
                    logger.debug(f"Ignoring non-transformer MQTT message on {msg.topic}")
                    return

            logger.debug(f"Received MQTT telemetry from {msg.topic}: {data.get('transformer_id') or data.get('asset_id')}")

            if self.on_telemetry_received:
                self.on_telemetry_received(data)

            for cb in self._callbacks:
                try:
                    cb(data)
                except Exception as cb_err:
                    logger.error(f"Error in MQTT callback: {cb_err}")

        except Exception as e:
            logger.error(f"Error handling MQTT message on topic {msg.topic}: {e}")

    @property
    def is_connected(self) -> bool:
        return self._is_connected

    @property
    def connection_status(self) -> str:
        return self._connection_status

    @property
    def messages_received_count(self) -> int:
        return self._messages_count

    @property
    def last_message_timestamp(self) -> Optional[float]:
        return self._last_message_time


# Alias for flexible import naming
MQTTService = MqttService


