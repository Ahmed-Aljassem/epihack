import json
import traceback
from pathlib import Path
from uuid import uuid4
from decimal import Decimal
from fastapi import Depends, FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import get_settings
from app.utils.dynamo import client as db
from app.utils import s3 as s3_utils
from app.utils.auth import get_current_user
from app.routers import surveys, responses, dashboard, auth

settings = get_settings()
LOCAL_REPORTS_DIR = Path(__file__).resolve().parents[2] / "local_reports"
LOCAL_REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def _aws_credentials_available() -> bool:
    return bool(settings.DYNAMO_ACCESS_KEY_ID and settings.DYNAMO_SECRET_ACCESS_KEY)


def _to_json_serializable(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj % 1 == 0 else float(obj)
    if isinstance(obj, dict):
        return {k: _to_json_serializable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_json_serializable(i) for i in obj]
    return obj


def _validate_report_payload(raw_data: dict) -> dict:
    raw_data.setdefault("event_id", str(uuid4()))
    required_fields = ["lat", "long", "report"]
    missing_fields = [field for field in required_fields if field not in raw_data]
    if missing_fields:
        raise ValueError(f"Missing required report fields: {', '.join(missing_fields)}")
    if not isinstance(raw_data["report"], list):
        raise ValueError("`report` must be a list of sub-reports")
    return raw_data


async def _save_report_locally(report_id: str, report_data: dict, image_map: dict[str, list[UploadFile]]) -> Path:
    report_dir = LOCAL_REPORTS_DIR / report_id
    report_dir.mkdir(parents=True, exist_ok=True)

    for sub in report_data.get("report", []):
        files = image_map.get(sub.get("type"), [])
        if not files:
            continue

        sub_dir = report_dir / sub["type"]
        sub_dir.mkdir(parents=True, exist_ok=True)
        local_urls: list[str] = []

        for idx, file in enumerate(files):
            content = await file.read()
            filename = Path(file.filename).name or f"file_{idx}"
            local_path = sub_dir / filename
            local_path.write_bytes(content)
            local_urls.append(str(local_path.relative_to(Path(__file__).resolve().parents[2])))

        sub["images"] = local_urls

    output_path = report_dir / "report.json"
    output_path.write_text(json.dumps(_to_json_serializable(report_data), indent=2), encoding="utf-8")
    return output_path


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

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# ── Routers ──────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(surveys.router)
app.include_router(responses.router)
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
        raw_data = json.loads(report)
        report_id = str(uuid4())
        raw_data = _validate_report_payload(raw_data)
        raw_data["report_id"] = report_id

        report_payload = {
            **raw_data,
            "lat": Decimal(str(raw_data["lat"])),
            "long": Decimal(str(raw_data["long"])),
        }

        image_map: dict[str, list[UploadFile]] = {
            "animal":      animal_images      or [],
            "human":       human_images       or [],
            "environment": environment_images or [],
        }

        use_local_storage = not _aws_credentials_available()

        if use_local_storage:
            saved_path = await _save_report_locally(report_id, report_payload, image_map)
            return {
                "status": "success",
                "report_id": report_id,
                "warning": "AWS credentials are not configured locally. Report saved to local_reports for development.",
                "local_path": str(saved_path),
            }

        # Upload images and attach URLs to the matching sub-report only when using AWS
        for sub in report_payload.get("report", []):
            files = image_map.get(sub.get("type"), [])
            if not files:
                continue

            sub["images"] = [
                await s3_utils.upload_report_image(report_id, sub["type"], f)
                for f in files
            ]

        db.put_item(settings.DYNAMO_REPORTS_TABLE, report_payload)
        return {"status": "success", "report_id": report_id}

    except Exception as e:
        error_details = traceback.format_exc()
        print(f"Error receiving report: {error_details}")
        return {
            "status": "error",
            "message": "Failed to receive report",
            "details": str(e),
        }

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
