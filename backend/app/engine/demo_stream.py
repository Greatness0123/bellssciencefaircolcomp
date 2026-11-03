import asyncio
import datetime
import json
import random
from pathlib import Path
from typing import Any, Dict, List

from app.core.config import settings
from app.engine.suricata_watcher import process_eve_event
from app.api.websockets import manager

DATASET_PATH = Path(__file__).resolve().parents[2] / "data" / "simulated_network_events.jsonl"
DATASET_SIZE = 20_000
_streamed_count = 0


def _build_demo_event(index: int, rng: random.Random) -> Dict[str, Any]:
    event_type = ("flow", "dns", "http", "tls")[index % 4]
    source_ip = f"192.0.2.{1 + (index % 253)}"
    destination_ip = f"198.51.100.{1 + ((index * 7) % 253)}"
    source_port = rng.randint(20_000, 65_000)
    destination_port = {"flow": rng.choice([22, 53, 80, 443, 8080]), "dns": 53, "http": 80, "tls": 443}[event_type]
    event: Dict[str, Any] = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "flow_id": index + 1,
        "event_type": event_type,
        "src_ip": source_ip,
        "src_port": source_port,
        "dest_ip": destination_ip,
        "dest_port": destination_port,
        "proto": "UDP" if event_type == "dns" else "TCP",
        "ip_v": 4,
        "simulated": True,
    }

    if event_type == "flow":
        event["flow"] = {
            "state": rng.choice(["established", "closed", "new"]),
            "bytes_toserver": rng.randint(64, 18_000),
            "bytes_toclient": rng.randint(64, 42_000),
        }
    elif event_type == "dns":
        event["dns"] = {
            "type": "request",
            "queries": [{"rrname": f"service-{index % 97}.demo.invalid", "rrtype": "A"}],
        }
    elif event_type == "http":
        event["http"] = {
            "hostname": f"service-{index % 31}.demo.invalid",
            "url": rng.choice(["/health", "/api/status", "/assets/index.js"]),
            "http_method": rng.choice(["GET", "POST"]),
            "protocol": "HTTP/1.1",
            "status": rng.choice([200, 200, 200, 304, 404]),
        }
    else:
        event["tls"] = {
            "sni": f"service-{index % 19}.demo.invalid",
            "version": "TLS 1.3",
        }

    return event


def load_demo_events() -> List[Dict[str, Any]]:
    DATASET_PATH.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(20261031)

    records: List[Dict[str, Any]] = []
    if DATASET_PATH.exists():
        with DATASET_PATH.open("r", encoding="utf-8") as source:
            for line in source:
                try:
                    value = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(value, dict):
                    records.append(value)

    if len(records) < DATASET_SIZE:
        records = [_build_demo_event(index, rng) for index in range(DATASET_SIZE)]
        with DATASET_PATH.open("w", encoding="utf-8", newline="\n") as destination:
            for record in records:
                destination.write(json.dumps(record, separators=(",", ":")) + "\n")

    return records


def get_streamed_count() -> int:
    return _streamed_count


def clear_demo_buffer() -> None:
    global _streamed_count
    from app.engine.suricata_watcher import clear_recent_logs

    clear_recent_logs()
    _streamed_count = 0


async def replay_demo_events() -> None:
    global _streamed_count
    records = load_demo_events()
    rng = random.Random()
    interval = max(0.1, settings.DEMO_EVENT_INTERVAL_SECONDS)

    while True:
        event = dict(rng.choice(records))
        event["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        event["flow_id"] = rng.randrange(1_000_000_000, 9_999_999_999)
        event["simulated"] = True
        await process_eve_event(event)
        _streamed_count += 1
        await manager.broadcast_json({"type": "STREAM_COUNT", "data": _streamed_count})
        await asyncio.sleep(interval)
