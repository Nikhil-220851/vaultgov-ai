import logging
from sqlalchemy import create_engine, text
from app.database.connection import DATABASE_URL

logging.basicConfig(level=logging.INFO)

def main():
    try:
        engine = create_engine(DATABASE_URL)
        with engine.begin() as conn:
            # Backfill NULL updated_at with created_at
            result = conn.execute(text("UPDATE conversations SET updated_at = created_at WHERE updated_at IS NULL"))
            print(f"Updated {result.rowcount} rows with NULL updated_at.")
            
            # Now alter the column to be NOT NULL and set a default
            # Postgres alter column:
            conn.execute(text("ALTER TABLE conversations ALTER COLUMN updated_at SET NOT NULL"))
            conn.execute(text("ALTER TABLE conversations ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP"))
            print("Successfully updated column constraints.")
    except Exception as e:
        print("Error updating database:", e)

if __name__ == "__main__":
    main()
