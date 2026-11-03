from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.database import get_db
from app.models import SensorState, Alert, Asset, User
from app.schemas import SensorStatusResponse, OverviewStatsResponse, SuricataLogEvent
from app.api.auth import get_current_active_user
from app.engine.suricata_watcher import clear_eve_log, count_eve_events, get_recent_logs
from app.core.config import settings
from app.api.websockets import manager

router = APIRouter(prefix="/agent", tags=["Agent & Overview"])


@router.get("/status", response_model=SensorStatusResponse)
async def get_sensor_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(SensorState))
    state = result.scalars().first()
    if not state:
        state = SensorState(
            id="Sensor-01",
            sensor_name="Sensor-01",
            status="Online",
            uptime_seconds=0,
            events_processed=0,
            detection_engine_status="Active",
            ruleset_version="custom-rules"
        )
        db.add(state)
        await db.commit()
        await db.refresh(state)
    return state


@router.get("/logs", response_model=List[SuricataLogEvent])
async def list_suricata_logs(
    current_user: User = Depends(get_current_active_user)
):
    return get_recent_logs()


@router.delete("/logs", status_code=status.HTTP_204_NO_CONTENT)
async def clear_suricata_logs(
    current_user: User = Depends(get_current_active_user)
):
    clear_eve_log(settings.EVE_LOG_PATH)
    await manager.broadcast_json({"type": "STREAM_CLEARED"})
    await manager.broadcast_json({"type": "STREAM_COUNT", "data": 0})


@router.get("/overview", response_model=OverviewStatsResponse)
async def get_overview_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    critical_res = await db.execute(select(func.count(Alert.id)).where(Alert.severity == "Critical"))
    critical_count = critical_res.scalar() or 0

    high_res = await db.execute(select(func.count(Alert.id)).where(Alert.severity == "High"))
    high_count = high_res.scalar() or 0

    open_res = await db.execute(select(func.count(Alert.id)).where(Alert.status.in_(["New", "Acknowledged", "Investigating"])))
    open_count = open_res.scalar() or 0

    assets_res = await db.execute(select(func.count(Asset.id)))
    assets_count = assets_res.scalar() or 0

    sensor_res = await db.execute(select(SensorState))
    sensor = sensor_res.scalars().first()
    sensor_status = sensor.status if sensor else "Online"
    events_processed = count_eve_events(settings.EVE_LOG_PATH)

    dist_res = await db.execute(select(Alert.severity, func.count(Alert.id)).group_by(Alert.severity))
    severity_distribution = {row[0]: row[1] for row in dist_res.all()}
    for level in ["Critical", "High", "Medium", "Low", "Informational"]:
        if level not in severity_distribution:
            severity_distribution[level] = 0

    recent_res = await db.execute(select(Alert).order_by(Alert.created_at.desc()).limit(10))
    recent_alerts = recent_res.scalars().all()
    recent_logs = get_recent_logs()[:50]

    return {
        "critical_count": critical_count,
        "high_count": high_count,
        "open_count": open_count,
        "monitored_assets_count": assets_count,
        "sensor_status": sensor_status,
        "events_processed": events_processed,
        "severity_distribution": severity_distribution,
        "recent_alerts": recent_alerts,
        "recent_logs": recent_logs,
    }
