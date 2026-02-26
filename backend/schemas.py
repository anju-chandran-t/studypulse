from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date


# ── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str


# ── Courses ───────────────────────────────────────────
class CourseCreate(BaseModel):
    course_name: str
    total_hours_required: float
    deadline: date


class CourseResponse(BaseModel):
    course_id: int
    course_name: str
    total_hours_required: float
    deadline: date

    class Config:
        from_attributes = True


# ── Study Sessions ────────────────────────────────────
class SessionCreate(BaseModel):
    course_id: int
    hours_studied: float
    notes: Optional[str] = None


class SessionResponse(BaseModel):
    session_id: int
    course_id: int
    hours_studied: float
    session_date: date
    notes: Optional[str]

    class Config:
        from_attributes = True


# ── Dashboard / Agent ─────────────────────────────────
class AIInsight(BaseModel):
    summary: str
    risk: str  # Low | Medium | High


class CourseAnalysis(BaseModel):
    course_id: int
    course: str
    deadline: str
    hours_studied: float
    hours_remaining: float
    days_left: int
    daily_hours_needed: Optional[float]
    ai: AIInsight
