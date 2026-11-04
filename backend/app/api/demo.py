import datetime
import ipaddress
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_active_user
from app.api.websockets import manager
from app.core.config import settings
from app.database import get_db
from app.engine.suricata_watcher import recent_logs_buffer
from app.models import Alert, AuditLog, NetworkEventLog, SensorState, User

router = APIRouter(prefix="/demo", tags=["Simulation Demo"])


class DemoThreatRequest(BaseModel):
    client_name: str = Field(default="Demo laptop", max_length=80)
    scenario: str = Field(default="Simulated unauthorized access attempt", max_length=120)


def _require_private_lan(request: Request) -> str:
    client_host = request.client.host if request.client else ""
    try:
        client_ip = ipaddress.ip_address(client_host.split("%", 1)[0])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Private LAN clients only") from exc
    if not client_ip.is_private and not client_ip.is_loopback:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Private LAN clients only")
    return client_host


async def _get_demo_alert(alert_id: str, db: AsyncSession) -> Alert:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert or not (alert.evidence_json or {}).get("simulated"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo incident not found")
    return alert


@router.post("/threat", status_code=status.HTTP_201_CREATED)
async def trigger_demo_threat(
    payload: DemoThreatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    client_host = _require_private_lan(request)
    alert_id = f"DEMO-{uuid.uuid4().hex[:12].upper()}"
    source_ip = client_host
    timestamp = datetime.datetime.now(datetime.timezone.utc)
    title = f" {payload.scenario}"
    evidence = {
        "simulated": True,
        "sender": payload.client_name,
        "scenario": payload.scenario,
        "notice": "Synthetic exercise only; no device access or network blocking occurred.",
    }

    alert = Alert(
        id=alert_id,
        title=title,
        severity="High",
        category="Simulated Activity",
        status="New",
        source_ip=source_ip,
        dest_ip=settings.DEMO_TARGET_IP,
        protocol="DOS",
        network_location="Isolated demonstration",
        description=f"{payload.client_name} submitted a simulated incident. No exploit or access attempt was performed.",
        evidence_json=evidence,
        caveat="SIMULATION ONLY. This is not a real network detection.",
        suggested_action="Select the incident and click Neutralize Demo Threat.",
        created_at=timestamp,
        updated_at=timestamp,
    )
    log_event = {
        "id": alert_id,
        "timestamp": timestamp.isoformat(),
        "event_type": "alert",
        "proto": "DOS",
        "src_ip": source_ip,
        "src_port": None,
        "dest_ip": settings.DEMO_TARGET_IP,
        "dest_port": None,
        "is_threat": True,
        "severity": "High",
        "signature": title,
        "category": "Simulated Activity",
        "details": payload.client_name,
        "simulated": True,
        "status": "New",
    }
    db.add(alert)
    db.add(NetworkEventLog(
        id=str(uuid.uuid4()),
        event_id=alert_id,
        event_data=log_event,
    ))
    sensor_res = await db.execute(select(SensorState))
    sensor = sensor_res.scalars().first()
    if not sensor:
        sensor = SensorState(id=settings.SENSOR_ID, sensor_name=settings.SENSOR_ID)
        db.add(sensor)
    sensor.events_processed = (sensor.events_processed or 0) + 1
    sensor.status = "Online"
    sensor.detection_engine_status = "Active"
    sensor.last_heartbeat = timestamp
    await db.commit()

    recent_logs_buffer.appendleft(log_event)
    await manager.broadcast_json({"type": "LOG_STREAM", "data": log_event})
    await manager.broadcast_json({"type": "STREAM_COUNT", "data": sensor.events_processed})

    return {"incident_id": alert_id, "status": "pending", "message": "Simulation event delivered"}


@router.get("/threat/{alert_id}")
async def get_demo_threat_status(
    alert_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    _require_private_lan(request)
    alert = await _get_demo_alert(alert_id, db)
    return {"incident_id": alert.id, "status": alert.status.lower()}


@router.post("/threat/{alert_id}/neutralize")
async def neutralize_demo_threat(
    alert_id: str,
    action: str = Query("automated", pattern="^(automated|quarantine|destroy|dismiss)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    alert = await _get_demo_alert(alert_id, db)
    if alert.status != "Neutralized":
        alert.status = "Neutralized"
        alert.updated_at = datetime.datetime.now(datetime.timezone.utc)
        alert.evidence_json = {
            **(alert.evidence_json or {}),
            "resolution_action": action,
        }
        db.add(AuditLog(
            actor_name=current_user.email,
            action="DEMO_THREAT_NEUTRALIZED",
            target_type="DEMO_ALERT",
            target_id=alert.id,
            details=f"Simulation resolved via {action}. No host controls were executed.",
        ))
        await db.commit()

    for log_event in recent_logs_buffer:
        if log_event.get("id") == alert.id:
            log_event["status"] = "Neutralized"
            log_event["resolution_action"] = action
            break

    event_logs = await db.execute(
        select(NetworkEventLog).where(NetworkEventLog.event_id == alert.id)
    )
    for event_log in event_logs.scalars():
        event_data = getattr(event_log, "event_data", {})
        if isinstance(event_data, dict):
            event_data["status"] = "Neutralized"
            setattr(event_log, "event_data", event_data)
    await db.commit()

    await manager.broadcast_json({
        "type": "DEMO_NEUTRALIZED",
        "data": {"id": alert.id, "status": "Neutralized", "resolution_action": action},
    })
    return {"incident_id": alert.id, "status": "neutralized"}
