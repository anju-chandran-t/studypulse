from sqlalchemy import Column, Integer, String, Float, Date, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    # MS SQL uses IDENTITY(1,1) — SQLAlchemy handles this via autoincrement
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    # MS SQL: GETDATE() equivalent via server_default
    created_at = Column(DateTime, server_default=func.getdate())

    courses = relationship("Course", back_populates="owner", cascade="all, delete")
    sessions = relationship("StudySession", back_populates="user", cascade="all, delete")


class Course(Base):
    __tablename__ = "courses"

    course_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    course_name = Column(String(200), nullable=False)
    total_hours_required = Column(Float, nullable=False)
    deadline = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.getdate())

    owner = relationship("User", back_populates="courses")
    sessions = relationship("StudySession", back_populates="course", cascade="all, delete")


class StudySession(Base):
    __tablename__ = "study_sessions"

    session_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.course_id", ondelete="CASCADE"), nullable=False)
    hours_studied = Column(Float, nullable=False)
    # MS SQL: CAST(GETDATE() AS DATE) for date-only default
    session_date = Column(Date, server_default=func.cast(func.getdate(), Date))
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime, server_default=func.getdate())

    user = relationship("User", back_populates="sessions")
    course = relationship("Course", back_populates="sessions")
