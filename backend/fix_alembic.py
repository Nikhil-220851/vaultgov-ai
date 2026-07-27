import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    # Clear existing rows
    conn.execute(text("DELETE FROM alembic_version"))
    
    # Insert the two active heads that are already in the DB
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('e210a22c5db0')"))
    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('b969a3c6e171')"))
    
    conn.commit()
    print("Database revision successfully updated to e210a22c5db0 and b969a3c6e171")
