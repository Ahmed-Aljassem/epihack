import json
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from app.config import get_settings
from app.utils.dynamo import client as db
from app.utils import s3 as s3_utils

settings = get_settings()
router = APIRouter(prefix="/api/reports", tags=["Reports"])
REPORTS = settings.DYNAMO_REPORTS_TABLE


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_report(
    report: str = Form(..., description="Report JSON (see sample_report.json)"),
    animal_images: list[UploadFile] | None = File(default=None),
    human_images: list[UploadFile] | None = File(default=None),
    environment_images: list[UploadFile] | None = File(default=None),
):
    """
    Submit a crowd-sourced field report with optional images.

    Send as multipart/form-data:
    - `report`: full report JSON serialised as a string
    - `animal_images`: image files for the animal sub-report
    - `human_images`: image files for the human sub-report
    - `environment_images`: image files for the environment sub-report

    Images are stored in S3; their URLs are saved into the matching sub-report.
    """
    try:
        data = json.loads(report)
        report_id = str(uuid4())
        data["report_id"] = report_id
        data["submitted_at"] = datetime.now(timezone.utc).isoformat()
        data["lat"] = Decimal(str(data["lat"]))
        data["long"] = Decimal(str(data["long"]))

        image_map: dict[str, list[UploadFile]] = {
            "animal":      animal_images      or [],
            "human":       human_images       or [],
            "environment": environment_images or [],
        }

        for sub in data.get("report", []):
            files = image_map.get(sub.get("type"), [])
            if files:
                sub["images"] = [
                    await s3_utils.upload_report_image(report_id, sub["type"], f)
                    for f in files
                ]

        db.put_item(REPORTS, data)
        return {"status": "success", "report_id": report_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit report: {e}")


@router.get("/")
async def list_reports():
    """Return all field reports, sorted newest first."""
    docs = db.scan(REPORTS)
    docs.sort(key=lambda d: d.get("submitted_at", ""), reverse=True)
    return docs


@router.get("/{report_id}")
async def get_report(report_id: str):
    """Return a single field report by report_id."""
    doc = db.find_one(REPORTS, {"report_id": report_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return doc
