import os
import json
import asyncio
import datetime
from collections import deque
from typing import List, Dict, Any
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Alert, SensorState, Asset
from app.core.config import settings
from app.api.websockets import manager

SURICATA_SEVERITY_MAP = {
    1: "Critical",
    2: "High",
    3: "Medium",
    4: "Low",
}

recent_logs_buffer: deque = deque(maxlen=200)
stream_generation = 0


def get_recent_logs() -> List[Dict[str, Any]]:
    return list(recent_logs_buffer)


def clear_recent_logs():
    global stream_generation
    recent_logs_buffer.clear()
    stream_generation += 1


def clear_eve_log(file_path: str):
    with open(file_path, "w", encoding="utf-8"):
        pass
    clear_recent_logs()


def count_eve_events(file_path: str) -> int:
    count = 0
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(event, dict):
                    count += 1
    except OSError:
        pass
    return count


def parse_suricata_event(event: dict) -> Dict[str, Any]:
    event_type = event.get("event_type", "unknown")
    proto = event.get("proto", "TCP")
    src_ip = event.get("src_ip", "0.0.0.0")
    src_port = event.get("src_port")
    dest_ip = event.get("dest_ip", "0.0.0.0")
    dest_port = event.get("dest_port")
    timestamp_str = event.get("timestamp", datetime.datetime.now(datetime.timezone.utc).isoformat())

    is_threat = (event_type == "alert")
    severity = None
    signature = None
    category = None
    details = ""

    if is_threat:
        alert_meta = event.get("alert", {})
        raw_sev = alert_meta.get("severity", 3)
        severity = SURICATA_SEVERITY_MAP.get(raw_sev, "Medium")
        signature = alert_meta.get("signature", "Threat Signature Detected")
        category = alert_meta.get("category", "Security Alert")
        details = signature
    elif event_type == "http":
        http_data = event.get("http", {})
        hostname = http_data.get("hostname", "")
        url = http_data.get("url", "")
        method = http_data.get("http_method", "")
        status = http_data.get("status", "")
        details = f"{method} {hostname}{url} ({status})".strip()
    elif event_type == "dns":
        dns_data = event.get("dns", {})
        queries = dns_data.get("queries", [])
        if queries and isinstance(queries, list):
            rrname = queries[0].get("rrname", "")
            rrtype = queries[0].get("rrtype", "")
            details = f"Query {rrtype} {rrname}".strip()
        else:
            details = f"DNS {dns_data.get('type', '')}"
    elif event_type == "tls":
        tls_data = event.get("tls", {})
        sni = tls_data.get("sni", "")
        version = tls_data.get("version", "")
        details = f"TLS {version} SNI: {sni}".strip()
    elif event_type == "flow":
        flow_data = event.get("flow", {})
        state = flow_data.get("state", "")
        bytes_in = flow_data.get("bytes_toserver", 0)
        bytes_out = flow_data.get("bytes_toclient", 0)
        details = f"Flow {state} In:{bytes_in}B Out:{bytes_out}B"
    else:
        details = f"{event_type.upper()} packet event"

    flow_id = event.get("flow_id", int(datetime.datetime.now().timestamp() * 1000))
    log_id = f"EVT-{(flow_id % 900000) + 100000}"

    return {
        "id": log_id,
        "timestamp": timestamp_str,
        "event_type": event_type,
        "proto": proto,
        "src_ip": src_ip,
        "src_port": src_port,
        "dest_ip": dest_ip,
        "dest_port": dest_port,
        "is_threat": is_threat,
        "severity": severity,
        "signature": signature,
        "category": category,
        "details": details,
    }


async def process_eve_event(event: dict):
    event_type = event.get("event_type")
    if event_type in ("stats", "engine"):
        return

    parsed_log = parse_suricata_event(event)
    recent_logs_buffer.appendleft(parsed_log)

    async with AsyncSessionLocal() as session:
        sensor_res = await session.execute(select(SensorState))
        sensor = sensor_res.scalars().first()
        if sensor:
            sensor.events_processed += 1
            sensor.status = "Online"
            sensor.detection_engine_status = "Active"
            sensor.last_heartbeat = datetime.datetime.now(datetime.timezone.utc)
            await session.commit()

    if parsed_log["is_threat"]:
        src_ip = parsed_log["src_ip"]
        dest_ip = parsed_log["dest_ip"]
        src_port = parsed_log["src_port"]
        dest_port = parsed_log["dest_port"]
        proto = parsed_log["proto"]
        source_str = f"{src_ip}:{src_port}" if src_port else src_ip
        dest_str = f"{dest_ip}:{dest_port}" if dest_port else dest_ip

        timestamp_str = parsed_log["timestamp"]
        event_time = datetime.datetime.now(datetime.timezone.utc)
        if timestamp_str:
            try:
                event_time = datetime.datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
            except Exception:
                pass

        alert_id = f"SNT-2026-{(hash(parsed_log['id']) % 9000) + 1000}"
        evidence = {
            "signature": parsed_log["signature"],
            "category": parsed_log["category"],
            "raw_log": event,
        }

        async with AsyncSessionLocal() as session:
            new_alert = Alert(
                id=alert_id,
                title=parsed_log["signature"],
                severity=parsed_log["severity"],
                category=parsed_log["category"],
                status="New",
                source_ip=source_str,
                dest_ip=dest_str,
                protocol=proto,
                network_location=settings.SENSOR_LOCATION,
                description=f"Suricata sensor flagged signature '{parsed_log['signature']}' targeting {dest_str}.",
                evidence_json=evidence,
                caveat="Automated sensor detection; requires analyst verification.",
                suggested_action="Review source host telemetry and isolate endpoint if malicious.",
                created_at=event_time,
                updated_at=event_time,
            )
            session.add(new_alert)
            await session.commit()

    await manager.broadcast_json({
        "type": "LOG_STREAM",
        "data": parsed_log,
    })


async def watch_eve_log(file_path: str):
    while True:
        if not os.path.exists(file_path):
            await asyncio.sleep(2.0)
            continue

        try:
            event_count = count_eve_events(file_path)
            observed_generation = stream_generation
            with open(file_path, "r", encoding="utf-8") as f:
                f.seek(0, os.SEEK_END)
                while True:
                    if observed_generation != stream_generation:
                        f.seek(0)
                        event_count = count_eve_events(file_path)
                        observed_generation = stream_generation
                        await manager.broadcast_json({
                            "type": "STREAM_COUNT",
                            "data": event_count,
                        })

                    line = f.readline()
                    if not line:
                        await asyncio.sleep(0.3)
                        continue

                    line = line.strip()
                    if not line:
                        continue

                    try:
                        event = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if not isinstance(event, dict):
                        continue

                    event_count += 1
                    await manager.broadcast_json({
                        "type": "STREAM_COUNT",
                        "data": event_count,
                    })
                    await process_eve_event(event)
        except Exception:
            await asyncio.sleep(2.0)
