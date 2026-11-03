import asyncio
from sqlalchemy import func, select
from app.database import engine, AsyncSessionLocal, Base
from app.models import User
from app.core.security import get_password_hash


async def seed_default_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User.email).where(
                func.lower(User.email).in_(
                    ["greatness@sentinel.ai", "analyst@sentinel.ai"]
                )
            )
        )
        existing_emails = {email.lower() for email in result.scalars()}
        default_users = [
            ("Greatness@sentinel.ai", "Operations Admin", "admin"),
            ("analyst@sentinel.ai", "Security Analyst", "analyst"),
        ]
        for email, full_name, role in default_users:
            if email.lower() not in existing_emails:
                session.add(
                    User(
                        email=email,
                        full_name=full_name,
                        role=role,
                        status="active",
                        hashed_password=get_password_hash("Greatness0123"),
                    )
                )

        await session.commit()


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_default_users()
    print("Default Sentinel demo users are present.")


if __name__ == "__main__":
    asyncio.run(seed())
