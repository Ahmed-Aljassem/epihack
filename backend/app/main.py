from uuid import uuid4

from decimal import Decimal

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from loguru import logger

# from app.config import get_settings
# from app.database import connect_db, close_db
# from app.routers import auth, surveys, responses, alerts, dashboard
# from app.services.anomaly_detector import scan_for_anomalies

from app.utils import dynamo

# settings = get_settings()
# scheduler = AsyncIOScheduler()

dynamo_client = dynamo.DynamoDBClient(table_name="epihack_reports")

# @asynccontextmanager
# async def lifespan(app: FastAPI):
# Startup
# await connect_db()
# scheduler.add_job(
#     scan_for_anomalies,
#     "interval",
#     minutes=settings.ALERT_SCAN_INTERVAL_MINUTES,
#     id="anomaly_scan",
# )
# scheduler.start()
# logger.info(f"🚀 Epidemic Radar API starting [{settings.ENVIRONMENT}]")
# yield
# # Shutdown
# scheduler.shutdown()
# await close_db()

app = FastAPI(
    title="Epidemic Radar API",
    description=(
        "Participatory surveillance system for early detection of "
        "epidemic/pandemic signals across human, animal, and environmental domains."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    # lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────
# app.include_router(auth.router)
# app.include_router(surveys.router)
# app.include_router(responses.router)
# app.include_router(alerts.router)
# app.include_router(dashboard.router)


# @app.get("/health", tags=["Health"])
# async def health_check():
# return {"status": "ok", "env": settings.ENVIRONMENT}

@app.post("/report", tags=["Reporting"])
async def receive_report(report: dict):
    """
    Endpoint to receive reports from the mobile app.
    Expects a JSON payload with report details.
    """
    try:

        report["report_id"] = str(uuid4())

        # Convert floats to Decimal
        report["lat"] = Decimal(str(report["lat"]))
        report["long"] = Decimal(str(report["long"]))

        dynamo_client.put_item(report)
        
        return {"status": "success", "message": "Report received"}
    
    except Exception as e:
        
        print(f"Error receiving report: {e}")
        return {"status": "error", "message": "Failed to receive report"}