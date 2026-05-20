import json
from uuid import uuid4
from decimal import Decimal
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.utils import dynamo
from app.utils import s3 as s3_utils
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

        dynamo_client.put_item(data)
        return {"status": "success", "report_id": report_id}

    except Exception as e:
        print(f"Error receiving report: {e}")
        return {"status": "error", "message": "Failed to receive report"}
