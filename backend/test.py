from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import os

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))


with engine.connect() as conn:
    result = conn.execute(text("SELECT SUSER_SNAME()"))
    print("✅ Connected as Windows user:", result.fetchone()[0])