import os
from typing import Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Shared declarative base — imported by all ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a database session, ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection() -> None:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT current_database(), current_user, NOW()")
        )

        row = result.fetchone()

        print("Database connected successfully")
        print("Database:", row[0])
        print("User:", row[1])
        print("Server time:", row[2])