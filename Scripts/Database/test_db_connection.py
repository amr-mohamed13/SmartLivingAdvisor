from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from Scripts.Database.orm_models.property_model import Base, RealEstateData

if __name__ == "__main__" and (__package__ is None or __package__ == ""):
    print("Please run as module from project root:\n  python -m Scripts.Database.test_db_connection")
    raise SystemExit(1)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Ensure tables are created before querying
Base.metadata.create_all(engine)

try:
    records = session.query(RealEstateData).limit(5).all()
    print(f"Connected successfully. Found {len(records)} records.")
except Exception as e:
    print("Error:", e)
