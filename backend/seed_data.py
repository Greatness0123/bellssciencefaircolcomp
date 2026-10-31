import asyncio
import datetime
from app.database import engine, AsyncSessionLocal, Base
from app.models import User, SensorState, AuditLog
from app.core.security import get_password_hash


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        admin_user = User(
            email="Greatness@sentinel.ai",
            full_name="Operations Admin",
            role="admin",
            status="active",
            hashed_password=get_password_hash("Greatness0123"),
        )
        analyst_user = User(
            email="analyst@sentinel.ai",
            full_name="Security Analyst",
            role="analyst",
            status="active",
            hashed_password=get_password_hash("Greatness0123"),
        )
        session.add_all([admin_user, analyst_user])

        sensor = SensorState(
            id="Sensor-01",
            sensor_name="Sensor-01",
            status="Waiting for Sensor",
            uptime_seconds=0,
            events_processed=0,
            detection_engine_status="Idle",
            ruleset_version="custom-rules",
            last_heartbeat=datetime.datetime.now(datetime.timezone.utc),
        )
        session.add(sensor)

        audit_entry = AuditLog(
            actor_name="system",
            action="SYSTEM_INIT",
            target_type="SYSTEM",
            details="Sentinel AI database initialized with zero alerts. Awaiting Suricata events.",
            timestamp=datetime.datetime.now(datetime.timezone.utc),
        )
        session.add(audit_entry)

        await session.commit()
        print("Database wiped clean: 0 mock alerts, 0 mock assets. Ready for live Suricata data.")


if __name__ == "__main__":
    asyncio.run(seed())
