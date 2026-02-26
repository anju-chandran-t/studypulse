from sqlalchemy.orm import Session
from sqlalchemy import func
from models import User, Course, StudySession
from schemas import UserRegister, CourseCreate, SessionCreate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── Users ─────────────────────────────────────────────
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.user_id == user_id).first()


def create_user(db: Session, user: UserRegister):
    hashed = pwd_context.hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        password_hash=hashed
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Courses ───────────────────────────────────────────
def get_courses_by_user(db: Session, user_id: int):
    return db.query(Course).filter(Course.user_id == user_id).all()


def create_course(db: Session, user_id: int, course: CourseCreate):
    db_course = Course(
        user_id=user_id,
        course_name=course.course_name,
        total_hours_required=course.total_hours_required,
        deadline=course.deadline
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, course_id: int, user_id: int):
    course = db.query(Course).filter(
        Course.course_id == course_id,
        Course.user_id == user_id
    ).first()
    if course:
        db.delete(course)
        db.commit()
    return course


# ── Study Sessions ────────────────────────────────────
def log_study_session(db: Session, user_id: int, session: SessionCreate):
    db_session = StudySession(
        user_id=user_id,
        course_id=session.course_id,
        hours_studied=session.hours_studied,
        notes=session.notes
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_sessions_by_user(db: Session, user_id: int):
    return db.query(StudySession).filter(StudySession.user_id == user_id)\
             .order_by(StudySession.logged_at.desc()).all()


def get_hours_studied_for_course(db: Session, course_id: int) -> float:
    result = db.query(func.sum(StudySession.hours_studied))\
               .filter(StudySession.course_id == course_id)\
               .scalar()
    return result or 0.0
