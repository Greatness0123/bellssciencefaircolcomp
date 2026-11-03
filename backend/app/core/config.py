from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Sentinel AI Security Console"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "sentinel-ai-insecure-dev-secret-key-change-in-prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    DATABASE_URL: str = "sqlite+aiosqlite:///./demo_sentinel.db"
    DEMO_TARGET_IP: str = "198.51.100.108"
    DEMO_DISCOVERY_PORT: int = 39547
    DEMO_EVENT_INTERVAL_SECONDS: float = 1.0
    SENSOR_ID: str = "Sensor-01"
    SENSOR_LOCATION: str = "Server VLAN (Promiscuous SPAN)"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    class Config:
        env_file = Path(__file__).resolve().parents[2] / ".env"
        extra = "allow"


settings = Settings()
