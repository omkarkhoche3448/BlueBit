import psycopg2
from psycopg2 import sql
import os
# Database connection parameters
DATABASE_URL = "postgresql://u9jp4ii7me8i14:pfa0c4247d74009ded7923ad12f768fb8838910ddaf06bcce9a8ddfb36c35a605@c1i13pt05ja4ag.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/df9ksv4fo25hui"

# Index creation queries
queries = [
    "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
    "CREATE INDEX IF NOT EXISTS idx_job_type ON jobs (job_type);",
    "CREATE INDEX IF NOT EXISTS idx_location ON jobs (location);",
    "CREATE INDEX IF NOT EXISTS idx_company ON jobs (company);",
    "CREATE INDEX IF NOT EXISTS idx_date_posted ON jobs (date_posted DESC);",
    "CREATE INDEX IF NOT EXISTS idx_max_amount ON jobs (max_amount DESC);",
    "CREATE INDEX IF NOT EXISTS idx_job_text_search ON jobs USING gin(to_tsvector('english', title || ' ' || description || ' ' || company));",
    """CREATE INDEX IF NOT EXISTS idx_job_search ON jobs USING gin(
        to_tsvector('english', title || ' ' || company || ' ' || location || ' ' || job_type),
        title gin_trgm_ops,
        company gin_trgm_ops,
        location gin_trgm_ops,
        job_type gin_trgm_ops
    );"""
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