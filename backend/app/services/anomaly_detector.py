"""
Anomaly detection service — runs on a scheduler to scan recent responses
and auto-generate alerts when statistical thresholds are exceeded.

Algorithm (v0 — baseline, replace with more sophisticated models):
  1. For each active survey, bucket responses by day.
  2. Compute rolling mean + std over a 14-day window.
  3. Flag days whose count deviates by > Z_SCORE standard deviations.
  4. If today is flagged and no open alert exists for that survey, create one.
"""
from datetime import datetime, timezone, timedelta
from loguru import logger
import numpy as np
from app.database import surveys_col, responses_col, alerts_col
from app.models.enums import SurveyStatus, AlertSeverity, AlertStatus
from app.config import get_settings

settings = get_settings()
Z_THRESHOLD = settings.ALERT_ANOMALY_Z_SCORE


def _severity_from_z(z: float) -> AlertSeverity:
    if z >= 5:
        return AlertSeverity.CRITICAL
    if z >= 4:
        return AlertSeverity.HIGH
    if z >= Z_THRESHOLD:
        return AlertSeverity.MEDIUM
    return AlertSeverity.LOW


async def scan_for_anomalies() -> None:
    logger.info("🔍 Running anomaly scan…")
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=14)

    active_surveys = await surveys_col().find(
        {"status": SurveyStatus.ACTIVE}
    ).to_list(length=200)

    for survey in active_surveys:
        survey_id = str(survey["_id"])

        # Aggregate daily response counts
        pipeline = [
            {"$match": {
                "survey_id": survey_id,
                "submitted_at": {"$gte": window_start},
            }},
            {"$group": {
                "_id": {
                    "y": {"$year": "$submitted_at"},
                    "m": {"$month": "$submitted_at"},
                    "d": {"$dayOfMonth": "$submitted_at"},
                },
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id.y": 1, "_id.m": 1, "_id.d": 1}},
        ]

        daily = [doc["count"] async for doc in responses_col().aggregate(pipeline)]

        if len(daily) < 3:
            continue  # Not enough data

        counts = np.array(daily, dtype=float)
        mean = counts[:-1].mean()
        std = counts[:-1].std() or 1.0  # avoid div-by-zero
        today_count = counts[-1]
        z = (today_count - mean) / std

        if z < Z_THRESHOLD:
            continue

        # Check for existing open alert
        existing = await alerts_col().find_one({
            "affected_survey_ids": survey_id,
            "status": AlertStatus.OPEN,
        })
        if existing:
            continue

        severity = _severity_from_z(z)
        alert_doc = {
            "title": f"Unusual response spike in: {survey['title']}",
            "description": (
                f"Today's response count ({int(today_count)}) is {z:.1f}σ above "
                f"the 14-day mean ({mean:.1f}). Possible early signal."
            ),
            "category": survey["category"],
            "severity": severity,
            "location": None,
            "affected_survey_ids": [survey_id],
            "anomaly_score": round(float(z), 3),
            "status": AlertStatus.OPEN,
            "created_at": now,
            "updated_at": now,
            "resolved_by": None,
        }
        await alerts_col().insert_one(alert_doc)
        logger.warning(
            f"⚠️  Alert created for survey '{survey['title']}' "
            f"(z={z:.2f}, severity={severity})"
        )

    logger.info("✅ Anomaly scan complete")
