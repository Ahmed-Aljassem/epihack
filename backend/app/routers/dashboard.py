"""
Dashboard API endpoints for viewing surveillance metrics and trends.
Aggregates reports and surveys data from DynamoDB.
"""

from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.config import get_settings
from app.utils.dynamo import client as db
from app.models.enums import ReportType

settings = get_settings()
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
REPORTS = settings.DYNAMO_REPORTS_TABLE
SURVEYS = settings.DYNAMO_SURVEYS_TABLE


# ────────────────────────────────────────────────────────────────
# ── Response Schemas
# ────────────────────────────────────────────────────────────────

class ReportTypeStats(BaseModel):
    """Statistics for a single report type."""
    type: str  # human | animal | environment
    count: int
    sick_cases: int
    death_cases: int
    percentage: float


class PastStatsResponse(BaseModel):
    """Historical report statistics."""
    total_reports: int
    reporting_period: str  # e.g., "last 30 days"
    by_type: list[ReportTypeStats]
    timestamp: datetime


class DailyTrendPoint(BaseModel):
    """Single data point for trend graph."""
    date: str  # ISO format: YYYY-MM-DD
    human: int
    animal: int
    environment: int
    total: int


class TimeSeriesTrendResponse(BaseModel):
    """Time series data for reports trend over past 7 days."""
    period: str  # e.g., "7 days"
    start_date: str
    end_date: str
    data: list[DailyTrendPoint]
    summary: dict[str, int]  # total counts for each type over period


# ────────────────────────────────────────────────────────────────
# ── Helper Functions
# ────────────────────────────────────────────────────────────────

def _parse_timestamp(timestamp_str: str) -> datetime | None:
    """
    Parse ISO format timestamp strings from DynamoDB.
    Handles both full ISO format and date-only formats.
    """
    if not timestamp_str:
        return None
    try:
        # Try parsing as ISO format with timezone
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        try:
            # Try parsing date-only format
            return datetime.strptime(timestamp_str, "%Y-%m-%d")
        except (ValueError, TypeError):
            return None


def _extract_report_type_data(report_item: dict) -> list[dict]:
    """
    Extract individual report entries from a report document.
    Each report_item has a 'report' array containing items with 'type', 'sick_flag', 'death_flag'.
    """
    reports = []
    report_array = report_item.get("report", [])
    
    if isinstance(report_array, list):
        for entry in report_array:
            if isinstance(entry, dict):
                reports.append({
                    "type": entry.get("type", "unknown"),
                    "sick_flag": entry.get("sick_flag", False),
                    "death_flag": entry.get("death_flag", False),
                })
    
    return reports


def _aggregate_reports_by_date(
    reports: list[dict],
    days_back: int = 7
) -> dict[str, dict[str, int]]:
    """
    Aggregate reports by date and type.
    Returns dict: {date_str -> {type -> count}}
    """
    # Initialize date range
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days_back - 1)
    
    # Initialize aggregation with all dates
    aggregation: dict[str, dict[str, int]] = {}
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        aggregation[date_str] = {
            "human": 0,
            "animal": 0,
            "environment": 0,
        }
        current_date += timedelta(days=1)
    
    # Aggregate reports by date
    for report in reports:
        timestamp_str = report.get("submitted_at", "")
        parsed_ts = _parse_timestamp(timestamp_str)
        
        if parsed_ts:
            report_date = parsed_ts.date().isoformat()
            report_items = _extract_report_type_data(report)
            
            for item in report_items:
                report_type = item.get("type", "unknown")
                # Normalize type
                if report_type in ["human", "animal", "environment"]:
                    if report_date in aggregation:
                        aggregation[report_date][report_type] += 1
    
    return aggregation


def _calculate_type_stats(all_reports: list[dict], days_back: int = 30) -> dict[str, Any]:
    """
    Calculate aggregated statistics by report type.
    """
    stats = {
        "human": {"count": 0, "sick": 0, "deaths": 0},
        "animal": {"count": 0, "sick": 0, "deaths": 0},
        "environment": {"count": 0, "sick": 0, "deaths": 0},
    }
    
    # Filter reports by date
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    for report in all_reports:
        timestamp_str = report.get("submitted_at", "")
        parsed_ts = _parse_timestamp(timestamp_str)
        
        if parsed_ts and parsed_ts >= cutoff_date:
            report_items = _extract_report_type_data(report)
            
            for item in report_items:
                report_type = item.get("type", "").lower()
                
                if report_type in stats:
                    stats[report_type]["count"] += 1
                    
                    if item.get("sick_flag"):
                        stats[report_type]["sick"] += 1
                    
                    if item.get("death_flag"):
                        stats[report_type]["deaths"] += 1
    
    return stats


# ────────────────────────────────────────────────────────────────
# ── API Endpoints
# ────────────────────────────────────────────────────────────────

@router.get("/stats/past", response_model=PastStatsResponse)
async def get_past_stats(days: int = 30):
    """
    Get aggregated report statistics over the past N days.
    
    Query Parameters:
    - days: Number of days to look back (default: 30)
    
    Returns statistics broken down by report type (human, animal, environment),
    including case counts, sick cases, and deaths.
    """
    try:
        if days < 1 or days > 365:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Days must be between 1 and 365"
            )
        
        # Fetch all reports from DynamoDB
        all_reports = db.scan(REPORTS)
        
        # Calculate statistics
        stats = _calculate_type_stats(all_reports, days_back=days)
        
        # Calculate totals and percentages
        total = sum(s["count"] for s in stats.values())
        
        by_type = []
        for report_type in ["human", "animal", "environment"]:
            type_stats = stats[report_type]
            percentage = (type_stats["count"] / total * 100) if total > 0 else 0
            
            by_type.append(
                ReportTypeStats(
                    type=report_type,
                    count=type_stats["count"],
                    sick_cases=type_stats["sick"],
                    death_cases=type_stats["deaths"],
                    percentage=round(percentage, 2),
                )
            )
        
        return PastStatsResponse(
            total_reports=total,
            reporting_period=f"last {days} days",
            by_type=by_type,
            timestamp=datetime.now(timezone.utc),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch past stats: {str(e)}"
        )


@router.get("/trends/7days", response_model=TimeSeriesTrendResponse)
async def get_7day_trend():
    """
    Get time series data for reports trend over the last 7 days.
    
    Returns daily breakdown of reports by type (human, animal, environment),
    useful for visualizing report submission trends and patterns.
    """
    try:
        # Fetch all reports
        all_reports = db.scan(REPORTS)
        
        # Aggregate by date
        daily_aggregation = _aggregate_reports_by_date(all_reports, days_back=7)
        
        # Build response
        trend_data = []
        summary = {"human": 0, "animal": 0, "environment": 0}
        
        for date_str in sorted(daily_aggregation.keys()):
            daily_counts = daily_aggregation[date_str]
            total_daily = sum(daily_counts.values())
            
            trend_data.append(
                DailyTrendPoint(
                    date=date_str,
                    human=daily_counts["human"],
                    animal=daily_counts["animal"],
                    environment=daily_counts["environment"],
                    total=total_daily,
                )
            )
            
            # Update summary
            for report_type in ["human", "animal", "environment"]:
                summary[report_type] += daily_counts[report_type]
        
        # Calculate date range
        end_date = datetime.now(timezone.utc).date().isoformat()
        start_date = (datetime.now(timezone.utc).date() - timedelta(days=6)).isoformat()
        
        return TimeSeriesTrendResponse(
            period="7 days",
            start_date=start_date,
            end_date=end_date,
            data=trend_data,
            summary=summary,
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trends: {str(e)}"
        )


@router.get("/summary")
async def get_dashboard_summary():
    """
    Get comprehensive dashboard summary including:
    - Total reports and surveys
    - Reports breakdown by type
    - Recent trends
    """
    try:
        all_reports = db.scan(REPORTS)
        
        # Calculate base stats
        total_reports = len(all_reports)
        
        # Stats for today
        today_cutoff = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_reports = [
            r for r in all_reports
            if _parse_timestamp(r.get("submitted_at", "")) and 
               _parse_timestamp(r.get("submitted_at")) >= today_cutoff
        ]
        
        # Calculate type stats (all time)
        all_time_stats = _calculate_type_stats(all_reports, days_back=365)
        
        # Calculate type stats (today)
        today_stats = _calculate_type_stats(today_reports, days_back=1)
        
        return {
            "total_reports_all_time": total_reports,
            "total_reports_today": len(today_reports),
            "reports_by_type": {
                "human": all_time_stats["human"]["count"],
                "animal": all_time_stats["animal"]["count"],
                "environment": all_time_stats["environment"]["count"],
            },
            "today_reports_by_type": {
                "human": today_stats["human"]["count"],
                "animal": today_stats["animal"]["count"],
                "environment": today_stats["environment"]["count"],
            },
            "total_deaths": sum(s["deaths"] for s in all_time_stats.values()),
            "total_sick_cases": sum(s["sick"] for s in all_time_stats.values()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard summary: {str(e)}"
        )
