from Scripts.Database.db_connection import engine
from Scripts.Database.orm_models.property_model import Base

if __name__ == "__main__" and (__package__ is None or __package__ == ""):
	print("Please run as module from project root:\n  python -m Scripts.Database.create_property_table")
	raise SystemExit(1)

# This creates the table structure in PostgreSQL using your ORM model
print("Creating table in database...")
Base.metadata.create_all(engine)
print("Table created successfully!")
