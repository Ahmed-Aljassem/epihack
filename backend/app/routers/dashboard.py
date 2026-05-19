from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from app.database import surveys_col, responses_col, alerts_col
from app.schemas.schemas import DashboardStats
from app.models.enums import SurveyStatus, AlertStatus, AlertSeverity
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
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

    return DashboardStats(
        total_surveys=total_surveys,
        active_surveys=active_surveys,
        total_responses_today=total_responses_today,
        total_responses_all_time=total_responses_all_time,
        open_alerts=open_alerts,
        critical_alerts=critical_alerts,
        responses_by_category=responses_by_category,
        recent_alerts=recent_alerts,
    )


@router.get("/trend")
async def response_trend(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Daily response counts over the past N days."""
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
