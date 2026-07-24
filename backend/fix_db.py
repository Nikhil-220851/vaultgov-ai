import os
from sqlalchemy import create_engine, text

url = "postgresql+psycopg://neondb_owner:npg_Rfd8JatU3XVI@ep-broad-bar-aofz8656.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(url)

try:
    with engine.begin() as conn:
        conn.execute(text("UPDATE alembic_version SET version_num = 'd1e2f3a4b5c6'"))
        print("Updated alembic_version to d1e2f3a4b5c6")
except Exception as e:
    print("Error updating:", e)
