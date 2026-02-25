# 📚 StudyPulse — AI Study Time Tracker

AI-powered study tracker using **Google Gemini**, **FastAPI**, **MS SQL Server**, and plain **HTML/CSS/JS**.

---

## 📁 Folder Structure

```
studypulse/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # SQLAlchemy + pyodbc MS SQL connection
│   ├── models.py            # ORM models (User, Course, StudySession)
│   ├── schemas.py           # Pydantic schemas
│   ├── crud.py              # DB query functions
│   ├── agent.py             # 🤖 Gemini AI agent (core intelligence)
│   ├── Dockerfile           # Installs MS SQL ODBC Driver 17
│   ├── requirements.txt
│   ├── .env                 # ← Add your keys and DB config here
│   └── routers/
│       ├── auth.py          # /auth/login, /auth/register
│       ├── courses.py       # /courses/{user_id}
│       ├── sessions.py      # /sessions/{user_id}
│       └── dashboard.py     # /dashboard/{user_id} ← triggers AI agent
│
├── frontend/
│   ├── index.html           # Login / Register
│   ├── dashboard.html       # AI course analysis cards
│   ├── add_course.html      # Add & delete courses
│   ├── log_session.html     # Log study hours
│   ├── css/style.css
│   └── js/
│       ├── auth.js          # Session management, toast
│       ├── dashboard.js     # Render AI analysis cards
│       ├── courses.js       # Course CRUD
│       └── sessions.js      # Session logging
│
├── database/
│   └── init.sql             # MS SQL Server schema (T-SQL)
│
├── docker-compose.yml       # MS SQL 2022 + backend containers
└── README.md
```

---

## 🚀 Quick Start

### 1. Configure Environment

Edit `backend/.env`:
```env
DATABASE_URL=mssql+pyodbc://sa:YourStrong%40Password123@localhost:1433/studypulse?driver=ODBC+Driver+17+for+SQL+Server
GEMINI_API_KEY=your-gemini-api-key-here
SECRET_KEY=your-secret-key-change-this
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> ⚠️ Special characters in the password (like `@`) must be URL-encoded in `DATABASE_URL`.  
> `@` → `%40`

---

### 2. Option A — Docker (Recommended, zero setup)

```bash
docker-compose up --build
```

This starts:
- **MS SQL Server 2022** (Developer Edition) on port `1433`
- **db-init** service that runs `init.sql` automatically
- **FastAPI backend** on port `8000`

---

### 2. Option B — Existing MS SQL Server

If you already have MS SQL Server running locally or on Azure:

**Step 1:** Run the schema manually in SSMS or sqlcmd:
```bash
sqlcmd -S localhost -U sa -P "YourStrong@Password123" -i database/init.sql
```

**Step 2:** Install the MS SQL ODBC Driver on your machine:
- Windows: [Download ODBC Driver 17](https://aka.ms/downloadmsodbcsql)
- macOS: `brew install msodbcsql17`
- Linux (Ubuntu): Follow [Microsoft's guide](https://learn.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server)

**Step 3:** Run the backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

### 3. Open the Frontend

Open `frontend/index.html` in a browser, or serve with:
```bash
cd frontend && python -m http.server 5500
# Visit: http://localhost:5500
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns token + user_id |
| GET | `/courses/{user_id}` | List all courses |
| POST | `/courses/{user_id}` | Add a course |
| DELETE | `/courses/{user_id}/{course_id}` | Delete a course |
| POST | `/sessions/{user_id}` | Log a study session |
| GET | `/sessions/{user_id}` | Get session history |
| GET | `/dashboard/{user_id}` | 🤖 Trigger AI analysis |

---

## 🤖 How the AI Agent Works

`GET /dashboard/{user_id}` triggers `agent.py`:

1. Fetches all courses for the user from MS SQL
2. Queries total hours studied per course (`SUM`)
3. Computes: `hours_remaining`, `days_left`, `daily_hours_needed`, `progress_pct`
4. Sends each course's data to **Gemini 2.0 Flash**
5. Gemini returns: `risk` (Low / Medium / High) + one-sentence `summary`
6. Falls back to rule-based risk scoring if Gemini is unavailable

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Agent | Google Gemini 2.0 Flash |
| Backend | FastAPI + Python 3.11 |
| Database | **MS SQL Server 2022** |
| ORM | SQLAlchemy + pyodbc |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Container | Docker + docker-compose |

---

## 🗃️ MS SQL Notes

- Schema uses `IDENTITY(1,1)` for auto-increment primary keys
- `NVARCHAR` used instead of `VARCHAR` for Unicode support
- `GETDATE()` used for timestamp defaults (T-SQL equivalent of `NOW()`)
- `ON DELETE CASCADE` set on foreign keys where appropriate
- Indexes added on `user_id` and `course_id` for query performance
