from Scripts.Database.db_connection import engine
from Scripts.Database.orm_models.user_models import Base

if __name__ == "__main__" and (__package__ is None or __package__ == ""):
	print("Please run as module from project root:\n  python -m Scripts.Database.create_user_tables")
	raise SystemExit(1)

print("Creating user tables...")
Base.metadata.create_all(engine)
print("User tables created successfully!")
