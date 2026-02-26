import google.generativeai as genai
import json
import os
from datetime import date
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models import Course
from crud import get_courses_by_user, get_hours_studied_for_course

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-2.5-flash")


def parse_gemini_json(raw: str) -> dict:
    """Safely parse JSON from Gemini response, handling markdown code blocks."""
    text = raw.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first line (```json or ```) and last line (```)
        lines = lines[1:-1]
        text = "\n".join(lines)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "summary": "Analysis unavailable at this time.",
            "risk": "Medium"
        }


def determine_risk(hours_remaining: float, days_left: int, daily_hours_needed: float) -> str:
    """Fallback rule-based risk if Gemini fails."""
    if days_left <= 0:
        return "High"
    if daily_hours_needed is None:
        return "Low"
    if daily_hours_needed > 5:
        return "High"
    elif daily_hours_needed > 2:
        return "Medium"
    return "Low"


async def study_analysis_agent(user_id: int, db: Session) -> list:
    """
    AI Agent: Fetches all courses for a user from DB,
    computes hours studied vs remaining, calls Gemini for 
    risk analysis and a plain-English summary per course.
    """
    courses = get_courses_by_user(db, user_id)
    analysis = []

    for course in courses:
        # Pull hours studied from DB
        studied = get_hours_studied_for_course(db, course.course_id)

        # Compute key metrics
        hours_remaining = max(course.total_hours_required - studied, 0)
        days_left = (course.deadline - date.today()).days
        daily_hours_needed = (
            round(hours_remaining / days_left, 2) if days_left > 0 else None
        )
        progress_pct = round((studied / course.total_hours_required) * 100, 1) \
                       if course.total_hours_required > 0 else 0

        # Build Gemini prompt
        prompt = f"""
You are a study coach AI assistant. Analyze the student's course progress below 
and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

Course: {course.course_name}
Total hours required: {course.total_hours_required}
Hours studied so far: {studied}
Hours remaining: {hours_remaining}
Progress: {progress_pct}%
Days until deadline: {days_left}
Daily study hours needed to finish on time: {daily_hours_needed if daily_hours_needed is not None else "Deadline passed"}

Return exactly this JSON:
{{
  "summary": "<one motivating sentence about their progress and what they need to do>",
  "risk": "<exactly one of: Low, Medium, High>"
}}
"""

        try:
            response = gemini_model.generate_content(prompt)
            ai_output = parse_gemini_json(response.text)

            # Validate risk value
            if ai_output.get("risk") not in ["Low", "Medium", "High"]:
                ai_output["risk"] = determine_risk(hours_remaining, days_left, daily_hours_needed)

        except Exception as e:
            print(f"[Agent Error] Gemini call failed for course {course.course_id}: {e}")
            ai_output = {
                "summary": f"Keep going! You need {daily_hours_needed}h/day to finish on time.",
                "risk": determine_risk(hours_remaining, days_left, daily_hours_needed)
            }

        analysis.append({
            "course_id": course.course_id,
            "course": course.course_name,
            "deadline": str(course.deadline),
            "hours_studied": round(studied, 2),
            "hours_remaining": round(hours_remaining, 2),
            "total_hours_required": course.total_hours_required,
            "progress_pct": progress_pct,
            "days_left": days_left,
            "daily_hours_needed": daily_hours_needed,
            "ai": ai_output
        })

    return analysis
