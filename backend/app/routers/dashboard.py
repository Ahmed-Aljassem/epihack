from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from app.database import surveys_col, responses_col, alerts_col, reports_col
from app.schemas.schemas import DashboardStats
from app.models.enums import SurveyStatus, AlertStatus, AlertSeverity
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # ── Survey / response counts ──────────────────────────────────
    total_surveys            = await surveys_col().count_documents({})
    active_surveys           = await surveys_col().count_documents({"status": SurveyStatus.ACTIVE})
    total_responses_today    = await responses_col().count_documents({"submitted_at": {"$gte": today_start}})
    total_responses_all_time = await responses_col().count_documents({})

    # ── Report counts (new collection) ────────────────────────────
    total_reports_today    = await reports_col().count_documents({"timestamp": {"$gte": today_start}})
    total_reports_all_time = await reports_col().count_documents({})

    # ── Alert counts ──────────────────────────────────────────────
    open_alerts     = await alerts_col().count_documents({"status": AlertStatus.OPEN})
    critical_alerts = await alerts_col().count_documents(
        {"status": AlertStatus.OPEN, "severity": AlertSeverity.CRITICAL}
    )

    # ── Survey responses by category (join) ───────────────────────
    pipeline_survey = [
        {"$lookup": {
            "from": "surveys",
            "localField": "survey_id",
            "foreignField": "_id",
            "as": "survey",
        }},
        {"$unwind": "$survey"},
        {"$group": {"_id": "$survey.category", "count": {"$sum": 1}}},
    ]
    responses_by_category = {
        doc["_id"]: doc["count"]
        async for doc in responses_col().aggregate(pipeline_survey)
    }

    # ── Reports grouped by type (via data array) ──────────────────
    pipeline_reports = [
        {"$unwind": "$data"},
        {"$group": {"_id": "$data.type", "count": {"$sum": 1}}},
    ]
    reports_by_type = {
        doc["_id"]: doc["count"]
        async for doc in reports_col().aggregate(pipeline_reports)
    }

    # ── Risk level distribution across all reports ────────────────
    pipeline_risk = [
        {"$group": {"_id": "$risk_level", "count": {"$sum": 1}}},
    ]
    risk_distribution = {
        doc["_id"]: doc["count"]
        async for doc in reports_col().aggregate(pipeline_risk)
    }

    # ── Recent alerts ─────────────────────────────────────────────
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
        total_reports_today=total_reports_today,
        total_reports_all_time=total_reports_all_time,
        open_alerts=open_alerts,
        critical_alerts=critical_alerts,
        responses_by_category=responses_by_category,
        reports_by_type=reports_by_type,
        risk_distribution=risk_distribution,
        recent_alerts=recent_alerts,
    )


@router.get("/trend")
async def response_trend(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Daily response + report counts over the past N days."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Survey responses
    pipeline_responses = [
        {"$match": {"submitted_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "year":  {"$year": "$submitted_at"},
                "month": {"$month": "$submitted_at"},
                "day":   {"$dayOfMonth": "$submitted_at"},
            },
            "responses": {"$sum": 1},
        }},
    ]

    # Incident reports
    pipeline_reports = [
        {"$match": {"timestamp": {"$gte": since}}},
        {"$group": {
            "_id": {
                "year":  {"$year": "$timestamp"},
                "month": {"$month": "$timestamp"},
                "day":   {"$dayOfMonth": "$timestamp"},
            },
            "reports": {"$sum": 1},
        }},
    ]

    resp_map: dict = {}
    async for doc in responses_col().aggregate(pipeline_responses):
        d = doc["_id"]
        key = f"{d['year']}-{d['month']:02d}-{d['day']:02d}"
        resp_map[key] = doc["responses"]

    rep_map: dict = {}
    async for doc in reports_col().aggregate(pipeline_reports):
        d = doc["_id"]
        key = f"{d['year']}-{d['month']:02d}-{d['day']:02d}"
        rep_map[key] = doc["reports"]

    # Merge by date
    all_dates = sorted(set(list(resp_map.keys()) + list(rep_map.keys())))
    result = [
        {
            "date": date,
            "responses": resp_map.get(date, 0),
            "reports": rep_map.get(date, 0),
        }
        for date in all_dates
    ]
    return result


@router.get("/risk-map")
async def risk_map(
    days: int = 30,
    current_user: dict = Depends(get_current_user),
):
    """
    Returns geo-located reports with risk_level for map rendering
    (supports the 'Show detailed maps' feature from the admin dashboard whiteboard).
    Filters to the last N days.
    """
    since = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = reports_col().find(
        {"timestamp": {"$gte": since}, "risk_level": {"$ne": "none"}},
        {"_id": 1, "event_id": 1, "latitude": 1, "longitude": 1, "risk_level": 1,
         "timestamp": 1, "data.type": 1},
    ).sort("timestamp", -1).limit(5000)

    docs = await cursor.to_list(length=5000)
    return [
        {
            "id": str(d["_id"]),
            "event_id": d.get("event_id"),
            "lat": d["latitude"],
            "lng": d["longitude"],
            "risk_level": d.get("risk_level", "none"),
            "timestamp": d.get("timestamp"),
            "types": list({item["type"] for item in d.get("data", [])}),
        }
        for d in docs
    ]
