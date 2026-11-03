import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


def utc_now():
    return datetime.datetime.now(datetime.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst", nullable=False)
    status = Column(String(50), default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_login_at = Column(DateTime(timezone=True), nullable=True)


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(100), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    ip_address = Column(String(100), nullable=False)
    asset_type = Column(String(100), nullable=False)
    segment = Column(String(100), nullable=False)
    status = Column(String(50), default="Online", nullable=False)
    sensor_coverage = Column(String(50), default="Confirmed", nullable=False)
    last_seen = Column(DateTime(timezone=True), default=utc_now)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    status = Column(String(50), default="New", index=True, nullable=False)
    source_ip = Column(String(100), nullable=True)
    dest_ip = Column(String(100), nullable=True)
    protocol = Column(String(20), default="TCP", nullable=False)
    network_location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    evidence_json = Column(JSON, nullable=True)
    caveat = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=True)
    assigned_to = Column(String(255), nullable=True)
    affected_asset_id = Column(String(100), ForeignKey("assets.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    notes = relationship("AlertNote", back_populates="alert", cascade="all, delete-orphan", lazy="selectin")
    affected_asset = relationship("Asset", lazy="selectin")


class AlertNote(Base):
    __tablename__ = "alert_notes"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(100), ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False)
    author_name = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    alert = relationship("Alert", back_populates="notes")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_name = Column(String(255), nullable=False)
    action = Column(String(100), nullable=False)
    target_type = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)


class SensorState(Base):
    __tablename__ = "sensor_state"

    id = Column(String(100), primary_key=True, default="Sensor-01")
    sensor_name = Column(String(255), default="Sensor-01")
    status = Column(String(50), default="Online")
    uptime_seconds = Column(Integer, default=0)
    last_heartbeat = Column(DateTime(timezone=True), default=utc_now)
    events_processed = Column(Integer, default=0)
    detection_engine_status = Column(String(50), default="Active")
    ruleset_version = Column(String(50), default="v1.4.2")
