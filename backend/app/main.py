from uuid import uuid4
from decimal import Decimal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.utils import dynamo
from app.routers import surveys, responses, alerts, dashboard
from app.routers.auth import cognito_router

settings = get_settings()

dynamo_client = dynamo.DynamoDBClient(table_name="epihack_reports")

app = FastAPI(
    title="Epidemic Radar API",
    description=(
        "Participatory surveillance system for early detection of "
        "epidemic/pandemic signals across human, animal, and environmental domains."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ── Routers ──────────────────────────────────────────────────────
app.include_router(cognito_router)
app.include_router(surveys.router)
app.include_router(responses.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)


# ── Core endpoints ────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.ENVIRONMENT}


@app.post("/report", tags=["Reporting"])
async def receive_report(report: dict):
    """Receive crowd-sourced reports from the mobile app."""
    try:
        report["report_id"] = str(uuid4())
        report["lat"] = Decimal(str(report["lat"]))
        report["long"] = Decimal(str(report["long"]))
        dynamo_client.put_item(report)
        return {"status": "success", "message": "Report received"}
    except Exception as e:
        print(f"Error receiving report: {e}")
        return {"status": "error", "message": "Failed to receive report"}
