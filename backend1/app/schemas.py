from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "analyst"


class UserCreate(UserBase):
    password: str


class UserInvite(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    status: str
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AlertNoteBase(BaseModel):
    content: str


class AlertNoteCreate(AlertNoteBase):
    pass


class AlertNoteResponse(AlertNoteBase):
    id: int
    alert_id: str
    author_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class AssetResponse(BaseModel):
    id: str
    name: str
    ip_address: str
    asset_type: str
    segment: str
    status: str
    sensor_coverage: str
    last_seen: datetime

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    status: str
    source_ip: Optional[str] = None
    dest_ip: Optional[str] = None
    protocol: str
    network_location: Optional[str] = None
    description: Optional[str] = None
    evidence_json: Optional[Dict[str, Any]] = None
    caveat: Optional[str] = None
    suggested_action: Optional[str] = None
    assigned_to: Optional[str] = None
    affected_asset_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes: List[AlertNoteResponse] = []
    affected_asset: Optional[AssetResponse] = None

    class Config:
        from_attributes = True


class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None


class AuditLogResponse(BaseModel):
    id: int
    actor_name: str
    action: str
    target_type: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class SensorStatusResponse(BaseModel):
    id: str
    sensor_name: str
    status: str
    uptime_seconds: int
    last_heartbeat: datetime
    events_processed: int
    detection_engine_status: str
    ruleset_version: str

    class Config:
        from_attributes = True


class SuricataLogEvent(BaseModel):
    id: str
    timestamp: str
    event_type: str
    proto: str
    src_ip: str
    src_port: Optional[int] = None
    dest_ip: str
    dest_port: Optional[int] = None
    is_threat: bool = False
    severity: Optional[str] = None
    signature: Optional[str] = None
    category: Optional[str] = None
    details: Optional[str] = None


class OverviewStatsResponse(BaseModel):
    critical_count: int
    high_count: int
    open_count: int
    monitored_assets_count: int
    sensor_status: str
    events_processed: int = 0
    severity_distribution: Dict[str, int]
    recent_alerts: List[AlertResponse]
    recent_logs: List[SuricataLogEvent] = []
