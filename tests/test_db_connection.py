import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

db_url = os.getenv("DATABASE_URL")

if not db_url:
    raise ValueError("DATABASE_URL not found. Check your .env file.")

def test_connection():
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT NOW(), current_database()")).fetchone()
            print("DB connection successful:", result)
    except Exception as e:
        print("DB connection failed:", e)

if __name__ == "__main__":
    test_connection()

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

with engine.connect() as conn:
    conn.execute(text(open("warehouse/schema.sql").read()))
    print("✅ Tables created")