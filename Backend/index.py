import psycopg2
from psycopg2 import sql
import os
# Database connection parameters
DATABASE_URL = os.getenv("NEON_CONNECTION_STRING")

# Index creation queries
queries = [
    "CREATE INDEX IF NOT EXISTS idx_job_type ON jobs (job_type);",
    "CREATE INDEX IF NOT EXISTS idx_location ON jobs (location);",
    "CREATE INDEX IF NOT EXISTS idx_company ON jobs (company);",
    "CREATE INDEX IF NOT EXISTS idx_date_posted ON jobs (date_posted DESC);",
    "CREATE INDEX IF NOT EXISTS idx_max_amount ON jobs (max_amount DESC);",
    "CREATE INDEX IF NOT EXISTS idx_job_text_search ON jobs USING gin(to_tsvector('english', title || ' ' || description || ' ' || company));"
]

try:
    # Establish connection
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Execute each query
    for query in queries:
        cur.execute(query)
        print(f"Executed: {query}")
    
    # Commit changes and close connection
    conn.commit()
    cur.close()
    conn.close()
    print("Indexes created successfully.")

except Exception as e:
    print(f"Error: {e}")