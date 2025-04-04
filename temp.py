from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

try:
    NEON_CONNECTION_STRING = "postgresql://u9jp4ii7me8i14:pfa0c4247d74009ded7923ad12f768fb8838910ddaf06bcce9a8ddfb36c35a605@c1i13pt05ja4ag.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/df9ksv4fo25hui"

    engine = create_engine(NEON_CONNECTION_STRING)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT clerk_id, pro_expiration_date FROM users;"))
        rows = result.fetchall()
        for row in rows:
            print(f"{row.clerk_id} | {row.pro_expiration_date}")
except OperationalError as e:
    print("❌ Connection failed:", e)
