import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import engine, Base
from app.api import auth, alerts, assets, agent, audit, websockets, demo
from app.engine.demo_stream import replay_demo_events
from app.engine.discovery import DemoDiscoveryProtocol


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    loop = asyncio.get_running_loop()
    discovery_transport, _ = await loop.create_datagram_endpoint(
        DemoDiscoveryProtocol,
        local_addr=("0.0.0.0", settings.DEMO_DISCOVERY_PORT),
        allow_broadcast=True,
    )
    replay_task = asyncio.create_task(replay_demo_events())
    yield
    replay_task.cancel()
    discovery_transport.close()
    try:
        await replay_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)
app.include_router(agent.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(demo.router, prefix=settings.API_V1_STR)
app.include_router(websockets.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}
