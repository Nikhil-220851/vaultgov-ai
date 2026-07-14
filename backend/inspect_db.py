import os
from sqlalchemy import create_engine, inspect, text

url = "postgresql+psycopg://neondb_owner:npg_Rfd8JatU3XVI@ep-broad-bar-aofz8656.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
engine = create_engine(url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM alembic_version"))
        print("alembic_version table:", result.fetchall())
except Exception as e:
    print("alembic_version error:", e)

inspector = inspect(engine)
columns = inspector.get_columns("documents")
print("documents columns:")
for col in columns:
    print(f"- {col['name']}: {col['type']} (nullable={col['nullable']})")
