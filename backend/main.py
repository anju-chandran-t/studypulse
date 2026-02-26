from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, courses, sessions, dashboard

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="StudyPulse API",
    description="AI-powered study time tracker using Google Gemini",
    version="1.0.0"
)

# Allow frontend (HTML files) to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "StudyPulse API is running ✅"}


@app.get("/health")
def health():
    return {"status": "ok"}
