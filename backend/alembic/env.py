"""
Alembic environment configuration.

Loads DATABASE_URL from the backend .env file and uses the SQLAlchemy
metadata from all ORM models so Alembic can diff and generate migrations.
"""

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool

# ── Add the backend root to sys.path so `app` imports resolve correctly ───────
backend_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_root))

# ── Load environment variables from backend/.env ─────────────────────────────
env_path = backend_root / ".env"
load_dotenv(dotenv_path=env_path)

# ── Import Base (which has all model metadata registered) ────────────────────
# Importing the model explicitly ensures it is registered on Base.metadata
from app.database.connection import Base  # noqa: E402
from app.models.user import User  # noqa: E402, F401
from app.models.document import Document  # noqa: E402, F401
from app.models.scheme import Scheme  # noqa: E402, F401


# ── Alembic Config ────────────────────────────────────────────────────────────
config = context.config

# Override the sqlalchemy.url from alembic.ini with the real DATABASE_URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL is not set. Cannot run Alembic migrations.")
config.set_main_option("sqlalchemy.url", database_url)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection required)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (requires live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
