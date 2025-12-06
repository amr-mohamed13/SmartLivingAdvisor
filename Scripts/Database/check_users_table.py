"""Quick script to check users table columns."""
from Scripts.Database.db_connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
    """))
    print("Users table columns:")
    for row in result:
        print(f"  - {row[0]} ({row[1]})")




