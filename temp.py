from sqlalchemy import create_engine, text
import os

# PostgreSQL connection string
NEON_CONNECTION_STRING = os.getenv("DATABASE_URL")

# Create engine
engine = create_engine(NEON_CONNECTION_STRING)

# SQL to add the column (JSON format for storing lists)
add_column_sql = """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS autofill_limit NUMERIC DEFAULT 50;
"""

try:
    with engine.connect() as conn:
        conn.execute(text(add_column_sql))
        print("✅ 'bookmarks' column added successfully to store list of values!")
except Exception as e:
    print("❌ Error adding column:", e)
