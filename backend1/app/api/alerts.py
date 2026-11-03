import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func

from app.database import get_db
from app.models import Alert, AlertNote, AuditLog, User
from app.schemas import AlertResponse, AlertUpdate, AlertNoteCreate, AlertNoteResponse
from app.api.auth import get_current_active_user
from app.api.websockets import manager

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    severity: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    category: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = select(Alert).order_by(Alert.created_at.desc())

    if severity:
        query = query.where(Alert.severity == severity)
    if status_filter:
        query = query.where(Alert.status == status_filter)
    if category:
        query = query.where(Alert.category == category)
    if assigned_to:
        query = query.where(Alert.assigned_to == assigned_to)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Alert.title.ilike(search_pattern),
                Alert.id.ilike(search_pattern),
                Alert.source_ip.ilike(search_pattern),
                Alert.dest_ip.ilike(search_pattern),
                Alert.description.ilike(search_pattern),
            )
        )

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    changes = []
    if payload.status and payload.status != alert.status:
        changes.append(f"status: {alert.status} -> {payload.status}")
        setattr(alert, "status", payload.status)

    if payload.assigned_to is not None and payload.assigned_to != alert.assigned_to:
        changes.append(f"assigned_to: {alert.assigned_to} -> {payload.assigned_to}")
        setattr(alert, "assigned_to", payload.assigned_to)

    if changes:
        setattr(alert, "updated_at", datetime.datetime.now(datetime.timezone.utc))
        audit = AuditLog(
            actor_name=current_user.email,
            action="ALERT_UPDATED",
            target_type="ALERT",
            target_id=alert.id,
            details=", ".join(changes)
        )
        db.add(audit)
        await db.commit()
        await db.refresh(alert)

        await manager.broadcast_json({
            "type": "ALERT_UPDATED",
            "data": {
                "id": alert.id,
                "status": alert.status,
                "assigned_to": alert.assigned_to,
                "updated_at": alert.updated_at.isoformat(),
            }
        })

    return alert


@router.post("/{alert_id}/notes", response_model=AlertNoteResponse)
async def add_alert_note(
    alert_id: str,
    payload: AlertNoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    note = AlertNote(
        alert_id=alert.id,
        author_name=current_user.full_name or current_user.email,
        content=payload.content
    )
    db.add(note)

    audit = AuditLog(
        actor_name=current_user.email,
        action="NOTE_ADDED",
        target_type="ALERT",
        target_id=alert.id,
        details=f"Added note: {payload.content[:60]}..."
    )
    db.add(audit)
    await db.commit()
    await db.refresh(note)

    await manager.broadcast_json({
        "type": "NOTE_ADDED",
        "data": {
            "alert_id": alert.id,
            "note_id": note.id,
            "author_name": note.author_name,
            "content": note.content,
            "created_at": note.created_at.isoformat(),
        }
    })

    return note
