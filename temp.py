from sqlalchemy import create_engine, inspect

# PostgreSQL connection string
NEON_CONNECTION_STRING = "postgresql://u9jp4ii7me8i14:pfa0c4247d74009ded7923ad12f768fb8838910ddaf06bcce9a8ddfb36c35a605@c1i13pt05ja4ag.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/df9ksv4fo25hui"

# Create engine
engine = create_engine(NEON_CONNECTION_STRING)

# Inspect and print column names
inspector = inspect(engine)
columns = inspector.get_columns('users')
column_names = [col['name'] for col in columns]

print("📋 Columns in 'users' table:", column_names)
