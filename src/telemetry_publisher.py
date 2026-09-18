"""
GridSentinel AI — Real-Time Simulated Transformer SCADA Telemetry Publisher
Module: src/telemetry_publisher.py

Continuously streams realistic, smooth physical transformer telemetry and DGA
gas measurements to the MQTT broker for hackathon demonstration.

DISCLAIMER & DEMO NOTE:
This script generates:
"Real-time simulated transformer sensor/SCADA telemetry"
It demonstrates the exact streaming architecture used by utility SCADA/IoT sensors.
Do NOT claim this is real utility SCADA data.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import random
import ssl
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

import paho.mqtt.client as mqtt

# Attempt to load environment variables from project root
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    if _env_path.exists():
        load_dotenv(_env_path)
except ImportError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("telemetry_publisher")


# Initial states with realistic baseline values for our fleet
TRANSFORMER_SIMULATION_SEEDS: List[Dict[str, Any]] = [
    {
        "transformer_id": "TX-401",
        "substation_id": "SUB-METRO-09",
        "model": "Siemens 345kV/138kV 400MVA Autotransformer",
        "oil_temperature": 108.5,
        "oil_min": 104.0,
        "oil_max": 112.0,
        "vibration": 8.4,
        "vib_min": 7.5,
        "vib_max": 9.2,
        "load_percent": 94.0,
        "load_min": 89.0,
        "load_max": 98.0,
        "hydrogen_ppm": 320.0,
        "methane_ppm": 410.0,
        "ethane_ppm": 95.0,
        "ethylene_ppm": 280.0,
        "c2h2_ppm": 85.0,  # Critical active electrical arcing
        "c2h2_min": 78.0,
        "c2h2_max": 95.0,
    },
    {
        "transformer_id": "TX-102",
        "substation_id": "SUB-NORTH-01",
        "model": "ABB 230kV/69kV 150MVA Power Transformer",
        "oil_temperature": 92.0,
        "oil_min": 88.0,
        "oil_max": 95.0,
        "vibration": 5.1,
        "vib_min": 4.5,
        "vib_max": 5.8,
        "load_percent": 78.0,
        "load_min": 72.0,
        "load_max": 84.0,
        "hydrogen_ppm": 110.0,
        "methane_ppm": 140.0,
        "ethane_ppm": 30.0,
        "ethylene_ppm": 80.0,
        "c2h2_ppm": 12.0,  # Elevated discharge
        "c2h2_min": 9.0,
        "c2h2_max": 16.0,
    },
    {
        "transformer_id": "TX-303",
        "substation_id": "SUB-EAST-04",
        "model": "Westinghouse 115kV/13.2kV 45MVA Transformer",
        "oil_temperature": 88.0,
        "oil_min": 84.0,
        "oil_max": 91.0,
        "vibration": 4.8,
        "vib_min": 4.2,
        "vib_max": 5.3,
        "load_percent": 82.0,
        "load_min": 77.0,
        "load_max": 86.0,
        "hydrogen_ppm": 95.0,
        "methane_ppm": 90.0,
        "ethane_ppm": 40.0,
        "ethylene_ppm": 65.0,
        "c2h2_ppm": 8.0,
        "c2h2_min": 5.0,
        "c2h2_max": 11.0,
    },
    {
        "transformer_id": "TX-205",
        "substation_id": "SUB-WEST-02",
        "model": "GE 138kV/13.8kV 60MVA Substation Transformer",
        "oil_temperature": 72.0,
        "oil_min": 68.0,
        "oil_max": 75.0,
        "vibration": 2.2,
        "vib_min": 1.8,
        "vib_max": 2.6,
        "load_percent": 55.0,
        "load_min": 50.0,
        "load_max": 60.0,
        "hydrogen_ppm": 25.0,
        "methane_ppm": 18.0,
        "ethane_ppm": 8.0,
        "ethylene_ppm": 12.0,
        "c2h2_ppm": 0.0,
        "c2h2_min": 0.0,
        "c2h2_max": 0.5,
    },
]


class TelemetrySimulator:
    """Maintains evolving physical simulation state with realistic smooth drifting."""

    def __init__(self):
        self.state = {t["transformer_id"]: dict(t) for t in TRANSFORMER_SIMULATION_SEEDS}

    def next_reading(self, transformer_id: str) -> Dict[str, Any]:
        """Generate next reading with smooth random-walk variations."""
        t = self.state[transformer_id]

        # Oil temperature: small drift +/- 0.3°C
        oil_delta = random.uniform(-0.25, 0.30)
        t["oil_temperature"] = round(
            max(t["oil_min"], min(t["oil_max"], t["oil_temperature"] + oil_delta)),
            1
        )

        # Vibration: subtle mechanical drift +/- 0.08 mm/s
        vib_delta = random.uniform(-0.06, 0.07)
        t["vibration"] = round(
            max(t["vib_min"], min(t["vib_max"], t["vibration"] + vib_delta)),
            2
        )

        # Load percent: grid load fluctuation +/- 0.8%
        load_delta = random.uniform(-0.6, 0.7)
        t["load_percent"] = round(
            max(t["load_min"], min(t["load_max"], t["load_percent"] + load_delta)),
            1
        )

        # Acetylene C2H2: slow gas accumulation/dispersion
        c2h2_delta = random.uniform(-0.4, 0.5)
        t["c2h2_ppm"] = round(
            max(t["c2h2_min"], min(t["c2h2_max"], t["c2h2_ppm"] + c2h2_delta)),
            1
        )

        # Slight variation in other gases
        t["hydrogen_ppm"] = round(max(5.0, t["hydrogen_ppm"] + random.uniform(-0.8, 1.0)), 1)
        t["ethylene_ppm"] = round(max(5.0, t["ethylene_ppm"] + random.uniform(-0.6, 0.8)), 1)

        reading = {
            "transformer_id": transformer_id,
            "asset_id": transformer_id,
            "substation_id": t["substation_id"],
            "model": t["model"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "oil_temperature": t["oil_temperature"],
            "oil_temp_c": t["oil_temperature"],
            "vibration": t["vibration"],
            "vibration_mms": t["vibration"],
            "load_percent": t["load_percent"],
            "load_pct": t["load_percent"],
            "hydrogen_ppm": t["hydrogen_ppm"],
            "methane_ppm": t["methane_ppm"],
            "ethane_ppm": t["ethane_ppm"],
            "ethylene_ppm": t["ethylene_ppm"],
            "c2h2_ppm": t["c2h2_ppm"],
            "dga_ppm": {
                "hydrogen": t["hydrogen_ppm"],
                "methane": t["methane_ppm"],
                "ethane": t["ethane_ppm"],
                "ethylene": t["ethylene_ppm"],
                "acetylene": t["c2h2_ppm"],
            },
            "data_classification": "Real-time simulated transformer sensor/SCADA telemetry",
        }
        return reading


def run_publisher(
    broker_host: str,
    broker_port: int,
    username: str = "",
    password: str = "",
    use_tls: bool = False,
    topic_prefix: str = "grid/transformers",
    interval: float = 3.0,
    publish_once: bool = False,
) -> None:
    """Connect to MQTT broker and publish simulated transformer sensor telemetry."""
    print("=" * 70)
    print("  GridSentinel AI — Real-Time MQTT Telemetry Publisher")
    print("  Classification: Real-time simulated transformer sensor/SCADA telemetry")
    print(f"  Target Broker:  {broker_host}:{broker_port} (TLS: {use_tls})")
    print(f"  Topic Pattern:  {topic_prefix}/<asset_id>/telemetry")
    print(f"  Stream Rate:    Every {interval} seconds across 4 transformers")
    print("=" * 70)

    client_id = f"gridsentinel-publisher-{int(time.time())}"
    try:
        if hasattr(mqtt, "CallbackAPIVersion"):
            client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        else:
            client = mqtt.Client(client_id=client_id)
    except Exception:
        client = mqtt.Client(client_id=client_id)

    if username and password:
        client.username_pw_set(username, password)

    if use_tls:
        try:
            client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS_CLIENT)
        except Exception as e:
            logger.warning(f"Failed to enable TLS: {e}")

    connected = False

    def on_connect(c: Any, userdata: Any, flags: Any, rc_or_reason: Any, *args: Any) -> None:
        nonlocal connected
        rc = rc_or_reason if isinstance(rc_or_reason, int) else getattr(rc_or_reason, "value", 0)
        if rc == 0:
            connected = True
            logger.info("Connected successfully to MQTT broker.")
        else:
            logger.error(f"MQTT connection refused (code: {rc})")

    client.on_connect = on_connect

    try:
        logger.info(f"Connecting to MQTT broker {broker_host}:{broker_port}...")
        client.connect(broker_host, broker_port, keepalive=60)
        client.loop_start()
    except Exception as e:
        logger.error(f"Failed to connect to MQTT broker: {e}")
        sys.exit(1)

    # Wait briefly for connection handshake
    for _ in range(50):
        if connected:
            break
        time.sleep(0.1)

    simulator = TelemetrySimulator()
    cycle = 0

    try:
        while True:
            cycle += 1
            print(f"\n[Cycle #{cycle}] Streaming Telemetry @ {datetime.now().strftime('%H:%M:%S')}:")

            for seed in TRANSFORMER_SIMULATION_SEEDS:
                asset_id = seed["transformer_id"]
                reading = simulator.next_reading(asset_id)
                topic = f"{topic_prefix}/{asset_id}/telemetry"

                payload_str = json.dumps(reading)
                client.publish(topic, payload_str, qos=1)

                # Pretty console indicator
                c2h2_str = f"C2H2: {reading['c2h2_ppm']:4.1f} ppm"
                if reading["c2h2_ppm"] > 50:
                    c2h2_str = f"\033[91m{c2h2_str} [CRITICAL ARCING]\033[0m"

                print(
                    f"  -> \033[1m{asset_id:<6}\033[0m | "
                    f"Oil: {reading['oil_temperature']:5.1f}°C | "
                    f"Load: {reading['load_percent']:4.1f}% | "
                    f"Vib: {reading['vibration']:4.2f} mm/s | "
                    f"{c2h2_str}"
                )

            if publish_once:
                break

            time.sleep(interval)

    except KeyboardInterrupt:
        logger.info("Publisher stopped by operator.")
    finally:
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT publisher disconnected.")


def main():
    parser = argparse.ArgumentParser(description="GridSentinel AI Simulated SCADA Telemetry Publisher")
    parser.add_argument("--broker", default=os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com"), help="MQTT Broker Host")
    parser.add_argument("--port", type=int, default=int(os.getenv("MQTT_BROKER_PORT", "1883")), help="MQTT Broker Port")
    parser.add_argument("--user", default=os.getenv("MQTT_USERNAME", ""), help="MQTT Username")
    parser.add_argument("--password", default=os.getenv("MQTT_PASSWORD", ""), help="MQTT Password")
    parser.add_argument("--tls", action="store_true", default=os.getenv("MQTT_USE_TLS", "false").lower() in ("true", "1"), help="Enable TLS")
    parser.add_argument("--prefix", default=os.getenv("MQTT_TOPIC_PREFIX", "grid/transformers"), help="Topic prefix")
    parser.add_argument("--interval", type=float, default=3.0, help="Publish interval in seconds")
    parser.add_argument("--once", action="store_true", help="Publish single cycle and exit")

    args = parser.parse_args()

    run_publisher(
        broker_host=args.broker,
        broker_port=args.port,
        username=args.user,
        password=args.password,
        use_tls=args.tls,
        topic_prefix=args.prefix,
        interval=args.interval,
        publish_once=args.once,
    )


if __name__ == "__main__":
    main()

