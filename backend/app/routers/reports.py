"""
/api/reports — Incident Report CRUD + media upload.

Key design decisions from the whiteboard:
  • report_id  → MongoDB _id (auto)
  • event_id   → backend-generated UUID (one per report row)
  • lat / long → top-level floats for easy 2dsphere indexing
  • timestamp  → server-assigned UTC datetime
  • data       → list[ReportDataItem] (type, sick_flag, symptoms,
                  death_flag, species, images/vid URLs, number_affected)
  • uuid       → user_id FK from JWT

Media upload flow (two-step):
  1. POST /api/reports/             → creates report, returns report_id
  2. POST /api/reports/{id}/media   → multipart upload; URLs stored in data[i].media_urls

Admin extras:
  GET  /api/reports/export/csv      → full CSV export
"""
import csv
import io
import uuid
from datetime import datetime, timezone
from fastapi import (
    APIRouter, HTTPException, status, Depends,
    Query, UploadFile, File, Form,
)
from fastapi.responses import StreamingResponse
from bson import ObjectId
from loguru import logger

from app.database import reports_col
from app.schemas.schemas import ReportCreate, ReportOut, ReportStatusUpdate
from app.models.enums import UserRole, RiskLevel, ReportType
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/reports", tags=["Reports"])

ANALYST_ROLES = (UserRole.EPIDEMIOLOGIST, UserRole.ADMIN)


# ── Serialization ─────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


# ── Helpers ───────────────────────────────────────────────────────

def _build_geo_point(lat: float, lng: float) -> dict:
    """GeoJSON Point for 2dsphere indexing."""
    return {"type": "Point", "coordinates": [lng, lat]}


# ── CREATE ────────────────────────────────────────────────────────

@router.post("/", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    payload: ReportCreate,
    current_user: dict = Depends(get_current_user),
):
    """
    File a new incident report.
    The backend assigns report_id (MongoDB _id) and event_id (UUID) automatically.
    Media files are uploaded separately via POST /api/reports/{id}/media.
    """
    now = datetime.now(timezone.utc)
    event_id = str(uuid.uuid4())

    doc = {
        "event_id": event_id,
        "user_id": str(current_user["_id"]),
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        # GeoJSON point for spatial queries
        "location": _build_geo_point(payload.latitude, payload.longitude),
        "timestamp": now,
        "data": [item.model_dump() for item in payload.data],
        "notes": payload.notes,
        "risk_level": RiskLevel.NONE,
        "created_at": now,
        "updated_at": now,
    }

    result = await reports_col().insert_one(doc)
    doc["_id"] = result.inserted_id

    logger.info(
        f"📋 Report created: event_id={event_id} "
        f"user={current_user['email']} "
        f"types={[d['type'] for d in doc['data']]}"
    )
    return ReportOut(**_serialize(doc))


# ── MEDIA UPLOAD ──────────────────────────────────────────────────

@router.post("/{report_id}/media", response_model=ReportOut)
async def upload_media(
    report_id: str,
    data_index: int = Query(0, ge=0, description="Which data[] item to attach media to"),
    files: list[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload images / videos for a report data item.

    In production wire this to Supabase Storage or S3:
      1. Upload each file to the bucket.
      2. Store the returned public URLs in data[data_index].media_urls.

    Currently stores filenames as placeholder URLs so the endpoint
    is callable and testable without a bucket configured.
    """
    report = await reports_col().find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Authorization: only the owner or an admin can add media
    is_owner = str(report["user_id"]) == str(current_user["_id"])
    is_admin = current_user["role"] == UserRole.ADMIN
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to modify this report")

    data_list = report.get("data", [])
    if data_index >= len(data_list):
        raise HTTPException(
            status_code=400,
            detail=f"data_index {data_index} out of range (report has {len(data_list)} data items)",
        )

    # ── Replace with real storage client (Supabase / S3) ──────────
    # Example for Supabase:
    #   from supabase import create_client
    #   supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    #   for file in files:
    #       content = await file.read()
    #       path = f"reports/{report_id}/{file.filename}"
    #       supabase.storage.from_("media").upload(path, content)
    #       url = supabase.storage.from_("media").get_public_url(path)
    #       new_urls.append(url)
    # ──────────────────────────────────────────────────────────────

    new_urls = [f"/media/placeholder/{report_id}/{f.filename}" for f in files]
    existing_urls = data_list[data_index].get("media_urls", [])
    data_list[data_index]["media_urls"] = existing_urls + new_urls

    await reports_col().update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"data": data_list, "updated_at": datetime.now(timezone.utc)}},
    )

    updated = await reports_col().find_one({"_id": ObjectId(report_id)})
    return ReportOut(**_serialize(updated))


# ── READ ──────────────────────────────────────────────────────────

@router.get("/", response_model=list[ReportOut])
async def list_reports(
    type: ReportType | None = Query(None, description="Filter by report data type"),
    risk_level: RiskLevel | None = None,
    user_id: str | None = Query(None, description="Filter by reporter user_id (admin only)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    """
    List reports.
    - Citizens/health workers see only their own reports.
    - Epidemiologists/admins can see all and filter by user_id.
    """
    query: dict = {}

    is_analyst = current_user["role"] in ANALYST_ROLES
    if not is_analyst:
        # Regular users see only their own reports
        query["user_id"] = str(current_user["_id"])
    elif user_id:
        query["user_id"] = user_id

    if risk_level:
        query["risk_level"] = risk_level

    # Filter by report type inside the data array
    if type:
        query["data.type"] = type

    cursor = reports_col().find(query).sort("timestamp", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [ReportOut(**_serialize(d)) for d in docs]


@router.get("/export/csv")
async def export_reports_csv(
    _admin=Depends(require_role(*ANALYST_ROLES)),
):
    """
    Export all incident reports as CSV — admin dashboard feature (Image 2).
    Each row = one ReportDataItem with parent report metadata prefixed.
    """
    cursor = reports_col().find({}).sort("timestamp", -1)
    reports = await cursor.to_list(length=50_000)

    fieldnames = [
        "report_id", "event_id", "user_id", "latitude", "longitude",
        "timestamp", "risk_level", "notes",
        # data item fields (flattened — one row per data item)
        "type", "sick_flag", "symptoms", "death_flag",
        "species", "number_affected", "media_urls",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()

    for r in reports:
        base = {
            "report_id": str(r["_id"]),
            "event_id": r.get("event_id", ""),
            "user_id": r.get("user_id", ""),
            "latitude": r.get("latitude"),
            "longitude": r.get("longitude"),
            "timestamp": r.get("timestamp", "").isoformat() if r.get("timestamp") else "",
            "risk_level": r.get("risk_level", ""),
            "notes": r.get("notes", ""),
        }
        data_items = r.get("data", [{}])
        for item in data_items:
            row = {
                **base,
                "type": item.get("type", ""),
                "sick_flag": item.get("sick_flag", False),
                "symptoms": ";".join(item.get("symptoms") or []),
                "death_flag": item.get("death_flag", False),
                "species": item.get("species", ""),
                "number_affected": item.get("number_affected", ""),
                "media_urls": ";".join(item.get("media_urls") or []),
            }
            writer.writerow(row)

    output.seek(0)
    filename = f"epidemic_radar_reports_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{report_id}", response_model=ReportOut)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    doc = await reports_col().find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    is_owner = str(doc["user_id"]) == str(current_user["_id"])
    is_analyst = current_user["role"] in ANALYST_ROLES
    if not (is_owner or is_analyst):
        raise HTTPException(status_code=403, detail="Access denied")

    return ReportOut(**_serialize(doc))


# ── UPDATE ────────────────────────────────────────────────────────

@router.patch("/{report_id}/risk", response_model=ReportOut)
async def update_risk_level(
    report_id: str,
    payload: ReportStatusUpdate,
    _analyst=Depends(require_role(*ANALYST_ROLES)),
):
    """
    Analysts/admins can manually set or override the risk level of a report.
    The anomaly detector may also call this automatically.
    """
    result = await reports_col().update_one(
        {"_id": ObjectId(report_id)},
        {"$set": {"risk_level": payload.risk_level, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")

    updated = await reports_col().find_one({"_id": ObjectId(report_id)})
    return ReportOut(**_serialize(updated))


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Owner or admin can delete a report."""
    doc = await reports_col().find_one({"_id": ObjectId(report_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    is_owner = str(doc["user_id"]) == str(current_user["_id"])
    is_admin = current_user["role"] == UserRole.ADMIN
    if not (is_owner or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to delete this report")

    await reports_col().delete_one({"_id": ObjectId(report_id)})
