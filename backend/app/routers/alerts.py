from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, Query
from bson import ObjectId
from app.database import alerts_col
from app.schemas.schemas import AlertCreate, AlertOut
from app.models.enums import AlertStatus, AlertSeverity, SurveyCategory, UserRole
from app.utils.auth import get_current_user, require_role

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

ANALYST_ROLES = (UserRole.EPIDEMIOLOGIST, UserRole.ADMIN)


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/", response_model=list[AlertOut])
async def list_alerts(
    severity: AlertSeverity | None = None,
    alert_status: AlertStatus | None = None,
    category: SurveyCategory | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    query: dict = {}
    if severity:
        query["severity"] = severity
    if alert_status:
        query["status"] = alert_status
    if category:
        query["category"] = category

    cursor = alerts_col().find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [_serialize(d) for d in docs]


@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    current_user: dict = Depends(require_role(*ANALYST_ROLES)),
):
    now = datetime.now(timezone.utc)
    doc = {
        **payload.model_dump(),
        "status": AlertStatus.OPEN,
        "created_at": now,
        "updated_at": now,
        "resolved_by": None,
    }
    result = await alerts_col().insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: str):
    doc = await alerts_col().find_one({"_id": ObjectId(alert_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _serialize(doc)


@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    new_status: AlertStatus,
    current_user: dict = Depends(require_role(*ANALYST_ROLES)),
):
    update = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc),
    }
    if new_status in (AlertStatus.RESOLVED, AlertStatus.FALSE_POSITIVE):
        update["resolved_by"] = str(current_user["_id"])

    result = await alerts_col().update_one(
        {"_id": ObjectId(alert_id)},
        {"$set": update},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": f"Alert status updated to {new_status}"}
