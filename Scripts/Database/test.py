from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
import os

if __name__ == "__main__" and (__package__ is None or __package__ == ""):
	print("Please run as module from project root:\n  python -m Scripts.Database.test")
	raise SystemExit(1)

load_dotenv()
engine = create_engine(os.getenv("DATABASE_URL"))

inspector = inspect(engine)
print(inspector.get_table_names(schema="public"))
