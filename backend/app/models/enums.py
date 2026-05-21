"""
MongoDB document models — pure Python dataclasses used as type hints
alongside raw dicts returned by Motor. Pydantic schemas (schemas/) handle
request/response validation.
"""
from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "citizen"
    HEALTH_WORKER = "health_worker"
    VETERINARIAN = "veterinarian"
    EPIDEMIOLOGIST = "epidemiologist"
    ADMIN = "admin"


class SurveyCategory(str, Enum):
    HUMAN = "human"              # human illness symptoms
    ANIMAL = "animal"            # livestock / wildlife health
    ENVIRONMENT = "environment"  # water, soil, air anomalies
    VECTOR = "vector"            # mosquito / tick / rodent activity


class SurveyStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class QuestionType(str, Enum):
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    TEXT = "text"
    SCALE = "scale"          # 1–10 numeric scale
    BOOLEAN = "boolean"
    DATE = "date"
    GEO = "geo"              # coordinates capture


# ── Report-specific enums ─────────────────────────────────────────

class ReportType(str, Enum):
    """One Health domain — mirrors SurveyCategory but used on free-form reports."""
    HUMAN = "human"
    ANIMAL = "animal"
    ENVIRONMENT = "environment"
    VECTOR = "vector"


class Sex(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class RiskLevel(str, Enum):
    """Composite risk computed per geographic cluster."""
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
