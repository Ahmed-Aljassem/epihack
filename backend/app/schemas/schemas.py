from datetime import datetime
from typing import Any
from pydantic import BaseModel, EmailStr, Field, field_validator
from bson import ObjectId
from app.models.enums import (
    UserRole, SurveyCategory, SurveyStatus,
    AlertSeverity, AlertStatus, QuestionType,
    ReportType, Sex, RiskLevel,
)


# ── Shared ────────────────────────────────────────────────────────

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class GeoPoint(BaseModel):
    type: str = "Point"
    coordinates: list[float]  # [longitude, latitude]


# ── User ─────────────────────────────────────────────────────────
# Registration — minimal required fields to get a JWT token quickly.
# Extended profile is filled via PATCH /api/users/me/profile.

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.CITIZEN


class UserProfileUpdate(BaseModel):
    """
    All fields are optional so the client can PATCH only what changed.
    Mirrors the whiteboard: age, sex, nationality, notes, topics_interested,
    home_zips, phone_num, is_outdoor_worker, timezone.
    """
    age: int | None = Field(None, ge=0, le=130)
    sex: Sex | None = None
    nationality: str | None = Field(None, max_length=80)
    notes: str | None = Field(None, max_length=1000)
    topics_interested: list[str] = Field(
        default=[],
        description="Health or disease topics the user wants to follow",
    )
    home_zips: list[str] = Field(
        default=[],
        description="ZIP/postal codes of interest for alert notifications",
    )
    phone_num: str | None = Field(None, max_length=30)
    is_outdoor_worker: bool | None = Field(
        None,
        description="Does the user work outdoors? (exposure-risk factor)",
    )
    timezone: str | None = Field(
        None,
        max_length=60,
        description="IANA timezone string e.g. America/New_York",
    )
    # FK to the event/report stream the user is currently associated with
    fk_event_id: str | None = None


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: UserRole
    # Extended profile fields — all optional (may not be filled yet)
    age: int | None = None
    sex: Sex | None = None
    nationality: str | None = None
    notes: str | None = None
    topics_interested: list[str] = []
    home_zips: list[str] = []
    phone_num: str | None = None
    is_outdoor_worker: bool | None = None
    timezone: str | None = None
    fk_event_id: str | None = None
    created_at: datetime

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ── Incident Report ───────────────────────────────────────────────
# Matches the whiteboard "Reports" collection exactly.
# Each report maps to a user (uuid) and may carry one or more
# data items (ReportDataItem) inside the `data` JsonArray field.

class ReportDataItem(BaseModel):
    """
    One entry inside the `data` JSON array of a Report.
    All clinical / observational fields live here.
    """
    type: ReportType                        # human | animal | environment | vector
    sick_flag: bool = False                 # is the subject currently sick?
    symptoms: list[str] = Field(
        default=[],
        description="Free-text or coded symptom list e.g. ['fever', 'cough']",
    )
    death_flag: bool = False                # has a death occurred?
    species: str | None = Field(
        None,
        description="Relevant for animal / vector reports e.g. 'Gallus gallus'",
    )
    number_affected: int | None = Field(
        None, ge=0,
        description="Estimated count of affected individuals / animals",
    )
    # Media files are stored externally (e.g. Supabase Storage / S3).
    # This field stores the resolved public URL(s) after upload.
    media_urls: list[str] = Field(
        default=[],
        description="Uploaded image / video URLs (resolved after multipart upload)",
    )


class ReportCreate(BaseModel):
    """
    Body sent by the client when filing a new incident report.
    lat / long are top-level for fast geo-indexing.
    """
    latitude: float = Field(..., ge=-90,  le=90)
    longitude: float = Field(..., ge=-180, le=180)
    data: list[ReportDataItem] = Field(..., min_length=1)
    notes: str | None = Field(None, max_length=2000)


class ReportOut(BaseModel):
    """Full report document returned by the API."""
    id: str                     # MongoDB _id stringified
    event_id: str               # backend-generated UUID per individual event
    user_id: str                # uuid of the reporting user
    latitude: float
    longitude: float
    timestamp: datetime
    data: list[ReportDataItem]
    notes: str | None = None
    # Derived / computed fields
    risk_level: RiskLevel = RiskLevel.NONE

    class Config:
        populate_by_name = True


class ReportStatusUpdate(BaseModel):
    risk_level: RiskLevel


# ── Survey ────────────────────────────────────────────────────────

class QuestionOption(BaseModel):
    value: str
    label: str


class SurveyQuestion(BaseModel):
    id: str
    text: str
    type: QuestionType
    required: bool = True
    options: list[QuestionOption] | None = None
    min_value: float | None = None
    max_value: float | None = None


class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str
    category: SurveyCategory
    questions: list[SurveyQuestion] = Field(..., min_length=1)
    tags: list[str] = []
    target_region: str | None = None


class SurveyOut(SurveyCreate):
    id: str
    status: SurveyStatus
    response_count: int = 0
    created_by: str
    created_at: datetime
    updated_at: datetime


# ── Survey Response ───────────────────────────────────────────────

class ResponseAnswer(BaseModel):
    question_id: str
    value: Any   # str | list[str] | float | bool


class SurveyResponseCreate(BaseModel):
    survey_id: str
    answers: list[ResponseAnswer]
    location: GeoPoint | None = None
    notes: str | None = None


class SurveyResponseOut(SurveyResponseCreate):
    id: str
    user_id: str
    submitted_at: datetime


# ── Alert ─────────────────────────────────────────────────────────

class AlertCreate(BaseModel):
    title: str
    description: str
    category: SurveyCategory
    severity: AlertSeverity
    location: GeoPoint | None = None
    affected_survey_ids: list[str] = []
    affected_report_ids: list[str] = []
    anomaly_score: float | None = None


class AlertOut(AlertCreate):
    id: str
    status: AlertStatus
    created_at: datetime
    updated_at: datetime
    resolved_by: str | None = None


# ── Dashboard Stats ───────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_surveys: int
    active_surveys: int
    total_responses_today: int
    total_responses_all_time: int
    total_reports_today: int
    total_reports_all_time: int
    open_alerts: int
    critical_alerts: int
    responses_by_category: dict[str, int]
    reports_by_type: dict[str, int]
    risk_distribution: dict[str, int]
    recent_alerts: list[AlertOut]
