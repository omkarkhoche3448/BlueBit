from sqlalchemy import create_engine, text

# PostgreSQL connection string
NEON_CONNECTION_STRING = "postgresql://u9jp4ii7me8i14:pfa0c4247d74009ded7923ad12f768fb8838910ddaf06bcce9a8ddfb36c35a605@c1i13pt05ja4ag.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/df9ksv4fo25hui"

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
