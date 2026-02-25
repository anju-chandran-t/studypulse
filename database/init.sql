-- ============================================================
-- StudyPulse - MS SQL Server Schema
-- Run this in SSMS or sqlcmd to initialize the database
-- ============================================================

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'studypulse')
BEGIN
    CREATE DATABASE studypulse;
END
GO

USE studypulse;
GO

-- ── Users Table ───────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        user_id     INT IDENTITY(1,1) PRIMARY KEY,
        username    NVARCHAR(100) NOT NULL UNIQUE,
        email       NVARCHAR(150) NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        created_at  DATETIME DEFAULT GETDATE()
    );
END
GO

-- ── Courses Table ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='courses' AND xtype='U')
BEGIN
    CREATE TABLE courses (
        course_id             INT IDENTITY(1,1) PRIMARY KEY,
        user_id               INT NOT NULL,
        course_name           NVARCHAR(200) NOT NULL,
        total_hours_required  FLOAT NOT NULL,
        deadline              DATE NOT NULL,
        created_at            DATETIME DEFAULT GETDATE(),

        CONSTRAINT fk_courses_user
            FOREIGN KEY (user_id) REFERENCES users(user_id)
            ON DELETE CASCADE
    );
END
GO

-- ── Study Sessions Table ──────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='study_sessions' AND xtype='U')
BEGIN
    CREATE TABLE study_sessions (
        session_id    INT IDENTITY(1,1) PRIMARY KEY,
        user_id       INT NOT NULL,
        course_id     INT NOT NULL,
        hours_studied FLOAT NOT NULL,
        session_date  DATE DEFAULT CAST(GETDATE() AS DATE),
        notes         NVARCHAR(MAX) NULL,
        logged_at     DATETIME DEFAULT GETDATE(),

        CONSTRAINT fk_sessions_user
            FOREIGN KEY (user_id) REFERENCES users(user_id)
            ON DELETE NO ACTION,

        CONSTRAINT fk_sessions_course
            FOREIGN KEY (course_id) REFERENCES courses(course_id)
            ON DELETE CASCADE
    );
END
GO

-- ── Indexes for performance ───────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_courses_user_id')
    CREATE INDEX idx_courses_user_id ON courses(user_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_sessions_course_id')
    CREATE INDEX idx_sessions_course_id ON study_sessions(course_id);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_sessions_user_id')
    CREATE INDEX idx_sessions_user_id ON study_sessions(user_id);
GO

-- ── Sample test user (optional) ───────────────────────────────
IF NOT EXISTS (SELECT * FROM users WHERE username = 'testuser')
BEGIN
    INSERT INTO users (username, email, password_hash)
    VALUES ('testuser', 'test@example.com', 'hashed_password_placeholder');
END
GO

PRINT 'StudyPulse database initialized successfully.';
GO
