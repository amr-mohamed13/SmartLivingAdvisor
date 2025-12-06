"""
Migration script to update users table and create refresh_tokens table.
Run this after updating the ORM models.
"""

from Scripts.Database.db_connection import engine
from sqlalchemy import text

if __name__ == "__main__" and (__package__ is None or __package__ == ""):
    print("Please run as module from project root:\n  python -m Scripts.Database.migrate_auth_tables")
    raise SystemExit(1)

print("Starting authentication tables migration...")

with engine.connect() as conn:
    # Update users table - add new columns if they don't exist
    print("Updating users table...")
    
    try:
        # Add name column if it doesn't exist
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS name VARCHAR(255);
        """))
        
        # Add oauth_provider and oauth_id if they don't exist
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50);
        """))
        
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);
        """))
        
        # Add updated_at if it doesn't exist
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        """))
        
        # Migrate old google_id, facebook_id, apple_id to oauth_id (if columns exist)
        try:
            # Check if google_id column exists before trying to migrate
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'google_id';
            """))
            if result.fetchone():
                conn.execute(text("""
                    UPDATE users 
                    SET oauth_provider = 'google', oauth_id = google_id 
                    WHERE google_id IS NOT NULL AND oauth_id IS NULL;
                """))
        except Exception:
            pass  # Column doesn't exist, skip migration
        
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'facebook_id';
            """))
            if result.fetchone():
                conn.execute(text("""
                    UPDATE users 
                    SET oauth_provider = 'facebook', oauth_id = facebook_id 
                    WHERE facebook_id IS NOT NULL AND oauth_id IS NULL;
                """))
        except Exception:
            pass
        
        try:
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'apple_id';
            """))
            if result.fetchone():
                conn.execute(text("""
                    UPDATE users 
                    SET oauth_provider = 'apple', oauth_id = apple_id 
                    WHERE apple_id IS NOT NULL AND oauth_id IS NULL;
                """))
        except Exception:
            pass
        
        conn.commit()
        print("✓ Users table updated")
    except Exception as e:
        print(f"Warning: {e}")
        conn.rollback()
    
    # Create refresh_tokens table
    print("Creating refresh_tokens table...")
    try:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                token VARCHAR(512) UNIQUE NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked BOOLEAN DEFAULT FALSE
            );
        """))
        
        # Create indexes
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
        """))
        
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
        """))
        
        conn.commit()
        print("✓ Refresh tokens table created")
    except Exception as e:
        print(f"Warning: {e}")
        conn.rollback()
    
    # Update user_interactions table - change property_no to property_id if needed
    print("Updating user_interactions table...")
    try:
        # Check if property_id column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_interactions' AND column_name = 'property_id';
        """))
        
        if not result.fetchone():
            # Rename property_no to property_id
            conn.execute(text("""
                ALTER TABLE user_interactions 
                RENAME COLUMN property_no TO property_id;
            """))
            print("✓ Renamed property_no to property_id")
        
        conn.commit()
    except Exception as e:
        print(f"Warning: {e}")
        conn.rollback()

print("\n✓ Migration completed successfully!")
print("\nNext steps:")
print("1. Set JWT_SECRET_KEY in your .env file (use a strong random string)")
print("2. Configure OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.)")
print("3. Set FRONTEND_URL in backend .env (e.g., http://localhost:5173)")

