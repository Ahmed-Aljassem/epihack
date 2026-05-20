from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.config import get_settings
from app.schemas.schemas import AlertCreate, AlertOut
from app.models.enums import AlertStatus, AlertSeverity, SurveyCategory, UserRole
from app.utils.auth import get_current_user, require_role
from app.utils.dynamo import DynamoDBClient

settings = get_settings()
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])
_alerts = DynamoDBClient(settings.DYNAMO_ALERTS_TABLE)

ANALYST_ROLES = (UserRole.EPIDEMIOLOGIST, UserRole.ADMIN)


def _to_out(doc: dict) -> AlertOut:
    return AlertOut(**{**doc, "id": doc["alert_id"]})


@router.get("/", response_model=list[AlertOut])
async def list_alerts(
    severity: AlertSeverity | None = None,
    alert_status: AlertStatus | None = None,
    category: SurveyCategory | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    filters: dict = {}
    if severity:
        filters["severity"] = severity
    if alert_status:
        filters["status"] = alert_status
    if category:
        filters["category"] = category
    docs = _alerts.scan(filters or None)
    docs.sort(key=lambda d: d.get("created_at", ""), reverse=True)
    return [_to_out(d) for d in docs[skip : skip + limit]]


@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    current_user: dict = Depends(require_role(*ANALYST_ROLES)),
):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **payload.model_dump(),
        "alert_id": str(uuid4()),
        "status": AlertStatus.OPEN,
        "created_at": now,
        "updated_at": now,
        "resolved_by": None,
    }
    _alerts.put_item(doc)
    return _to_out(doc)


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: str):
    doc = _alerts.get_item({"alert_id": alert_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _to_out(doc)


@router.patch("/{alert_id}/status")
async def update_alert_status(
    alert_id: str,
    new_status: AlertStatus,
    current_user: dict = Depends(require_role(*ANALYST_ROLES)),
):
    if not _alerts.get_item({"alert_id": alert_id}):
        raise HTTPException(status_code=404, detail="Alert not found")
    updates: dict = {
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if new_status in (AlertStatus.RESOLVED, AlertStatus.FALSE_POSITIVE):
        updates["resolved_by"] = current_user["sub"]
    _alerts.update_item({"alert_id": alert_id}, updates)
    return {"message": f"Alert status updated to {new_status}"}
