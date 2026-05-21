from datetime import datetime, timezone, timedelta
from collections import Counter
from fastapi import APIRouter, Depends
from app.config import get_settings
from app.schemas.schemas import DashboardStats, AlertOut
from app.models.enums import SurveyStatus, AlertStatus, AlertSeverity
from app.utils.auth import get_current_user
from app.utils.dynamo import client as db

settings = get_settings()
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
SURVEYS = settings.DYNAMO_SURVEYS_TABLE
RESPONSES = settings.DYNAMO_RESPONSES_TABLE
ALERTS = settings.DYNAMO_ALERTS_TABLE


@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
    today_prefix = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    all_surveys = db.scan(SURVEYS)
    all_responses = db.scan(RESPONSES)
    all_alerts = db.scan(ALERTS)

    total_surveys = len(all_surveys)
    active_surveys = sum(1 for s in all_surveys if s.get("status") == SurveyStatus.ACTIVE)
    total_responses_today = sum(
        1 for r in all_responses if r.get("submitted_at", "").startswith(today_prefix)
    )
    total_responses_all_time = len(all_responses)
    open_alerts = sum(1 for a in all_alerts if a.get("status") == AlertStatus.OPEN)
    critical_alerts = sum(
        1 for a in all_alerts
        if a.get("status") == AlertStatus.OPEN and a.get("severity") == AlertSeverity.CRITICAL
    )

    responses_by_category = dict(Counter(r.get("category", "unknown") for r in all_responses))

    recent_alerts = sorted(all_alerts, key=lambda a: a.get("created_at", ""), reverse=True)[:5]
    recent_alert_outs = [AlertOut(**{**a, "id": a["alert_id"]}) for a in recent_alerts]

    return DashboardStats(
        total_surveys=total_surveys,
        active_surveys=active_surveys,
        total_responses_today=total_responses_today,
        total_responses_all_time=total_responses_all_time,
        open_alerts=open_alerts,
        critical_alerts=critical_alerts,
        responses_by_category=responses_by_category,
        recent_alerts=recent_alert_outs,
    )


@router.get("/trend")
async def response_trend(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Daily response counts over the past N days."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    all_responses = db.scan(RESPONSES)
    recent = [r for r in all_responses if r.get("submitted_at", "") >= since]
    counts = Counter(r["submitted_at"][:10] for r in recent)
    return [
        {"date": date, "count": count}
        for date, count in sorted(counts.items())
    ]
