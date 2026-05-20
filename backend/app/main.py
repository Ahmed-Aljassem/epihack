<<<<<<< HEAD
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from loguru import logger

from app.config import get_settings
from app.database import connect_db, close_db
from app.routers import auth, surveys, responses, alerts, dashboard
from app.services.anomaly_detector import scan_for_anomalies

settings = get_settings()
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    scheduler.add_job(
        scan_for_anomalies,
        "interval",
        minutes=settings.ALERT_SCAN_INTERVAL_MINUTES,
        id="anomaly_scan",
    )
    scheduler.start()
    logger.info(f"🚀 Epidemic Radar API starting [{settings.ENVIRONMENT}]")
    yield
    # Shutdown
    scheduler.shutdown()
    await close_db()

=======
import json
from uuid import uuid4
from decimal import Decimal
from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import get_settings
from app.utils.dynamo import client as db
from app.utils import s3 as s3_utils
from app.utils.auth import get_current_user
from app.routers import surveys, responses, alerts, dashboard, auth

settings = get_settings()
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92

app = FastAPI(
    title="Epidemic Radar API",
    description=(
        "Participatory surveillance system for early detection of "
        "epidemic/pandemic signals across human, animal, and environmental domains."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
<<<<<<< HEAD
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
=======
)

# ── Middleware ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
=======
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
# ── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(surveys.router)
app.include_router(responses.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)


<<<<<<< HEAD
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.ENVIRONMENT}
=======
# ── Core endpoints ────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "env": settings.ENVIRONMENT}


@app.post("/report", tags=["Reporting"])
async def receive_report(
    report: str = Form(..., description="Report JSON (see sample_report.json)"),
    animal_images: list[UploadFile] | None = File(default=None),
    human_images: list[UploadFile] | None = File(default=None),
    environment_images: list[UploadFile] | None = File(default=None),
):
    """
    Accept a crowd-sourced field report with optional images.

    Send as multipart/form-data:
    - `report`: the full report JSON serialised as a string
    - `animal_images`: zero or more image files for the animal sub-report
    - `human_images`:  zero or more image files for the human sub-report
    - `environment_images`: zero or more image files for the environment sub-report

    Uploaded images are stored in S3 and their URLs are written into the
    matching sub-report's `images` list before the document is saved to DynamoDB.
    """
    try:
        data = json.loads(report)
        report_id = str(uuid4())
        data["report_id"] = report_id
        data["lat"] = Decimal(str(data["lat"]))
        data["long"] = Decimal(str(data["long"]))

        image_map: dict[str, list[UploadFile]] = {
            "animal":      animal_images      or [],
            "human":       human_images       or [],
            "environment": environment_images or [],
        }

        # Upload images and attach S3 URLs to the matching sub-report
        for sub in data.get("report", []):
            files = image_map.get(sub.get("type"), [])
            if files:
                sub["images"] = [
                    await s3_utils.upload_report_image(report_id, sub["type"], f)
                    for f in files
                ]

        db.put_item(settings.DYNAMO_REPORTS_TABLE, data)
        return {"status": "success", "report_id": report_id}

    except Exception as e:
        print(f"Error receiving report: {e}")
        return {"status": "error", "message": "Failed to receive report"}

@app.post("/survey/response", tags=["Surveys"])
async def receive_survey_response(
    survey_response: str = Form(..., description="Survey response JSON"),
    current_user: dict = Depends(get_current_user),
):
    """
    Accept a survey response.

    Requires a valid Cognito id_token in the Authorization: Bearer header.
    The request body should be a JSON object containing the survey response data.
    """
    try:

        data = json.loads(survey_response)
        survey_id = str(uuid4())
        data["survey_id"] = survey_id

        print(f"Received survey response from {current_user['email']}: {survey_response}")

        db.put_item(settings.DYNAMO_SURVEYS_TABLE, data)

        return {"status": "success", "message": "Survey response received"}
    except Exception as e:
        print(f"Error receiving survey response: {e}")
        return {"status": "error", "message": "Failed to receive survey response"}
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
