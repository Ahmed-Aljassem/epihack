from datetime import datetime, timezone, timedelta
<<<<<<< HEAD
from fastapi import APIRouter, Depends
from app.database import surveys_col, responses_col, alerts_col
from app.schemas.schemas import DashboardStats
from app.models.enums import SurveyStatus, AlertStatus, AlertSeverity
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
=======
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
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92


@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
<<<<<<< HEAD
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Parallel aggregation queries
    total_surveys = await surveys_col().count_documents({})
    active_surveys = await surveys_col().count_documents({"status": SurveyStatus.ACTIVE})
    total_responses_today = await responses_col().count_documents(
        {"submitted_at": {"$gte": today_start}}
    )
    total_responses_all_time = await responses_col().count_documents({})
    open_alerts = await alerts_col().count_documents({"status": AlertStatus.OPEN})
    critical_alerts = await alerts_col().count_documents(
        {"status": AlertStatus.OPEN, "severity": AlertSeverity.CRITICAL}
    )

    # Responses grouped by survey category (join via survey_id)
    pipeline = [
        {"$lookup": {
            "from": "surveys",
            "localField": "survey_id",
            "foreignField": "_id",
            "as": "survey",
        }},
        {"$unwind": "$survey"},
        {"$group": {"_id": "$survey.category", "count": {"$sum": 1}}},
    ]
    cat_cursor = responses_col().aggregate(pipeline)
    responses_by_category = {
        doc["_id"]: doc["count"] async for doc in cat_cursor
    }

    # Recent alerts
    recent_raw = await alerts_col().find().sort("created_at", -1).limit(5).to_list(5)
    from app.schemas.schemas import AlertOut
    recent_alerts = []
    for doc in recent_raw:
        doc["id"] = str(doc.pop("_id"))
        recent_alerts.append(AlertOut(**doc))
=======
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
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92

    return DashboardStats(
        total_surveys=total_surveys,
        active_surveys=active_surveys,
        total_responses_today=total_responses_today,
        total_responses_all_time=total_responses_all_time,
        open_alerts=open_alerts,
        critical_alerts=critical_alerts,
        responses_by_category=responses_by_category,
<<<<<<< HEAD
        recent_alerts=recent_alerts,
=======
        recent_alerts=recent_alert_outs,
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
    )


@router.get("/trend")
async def response_trend(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Daily response counts over the past N days."""
<<<<<<< HEAD
    since = datetime.now(timezone.utc) - timedelta(days=days)
    pipeline = [
        {"$match": {"submitted_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "year": {"$year": "$submitted_at"},
                "month": {"$month": "$submitted_at"},
                "day": {"$dayOfMonth": "$submitted_at"},
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1, "_id.day": 1}},
    ]
    cursor = responses_col().aggregate(pipeline)
    result = []
    async for doc in cursor:
        d = doc["_id"]
        result.append({
            "date": f"{d['year']}-{d['month']:02d}-{d['day']:02d}",
            "count": doc["count"],
        })
    return result
=======
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    all_responses = db.scan(RESPONSES)
    recent = [r for r in all_responses if r.get("submitted_at", "") >= since]
    counts = Counter(r["submitted_at"][:10] for r in recent)
    return [
        {"date": date, "count": count}
        for date, count in sorted(counts.items())
    ]
>>>>>>> 72c64944a5e496fd7be003078c7848a3d6f8eb92
