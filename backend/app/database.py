from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = "sqlite:///./sentinel.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """
    Safe ALTER TABLE migrations for SQLite.
    SQLite doesn't support DROP COLUMN or ADD COLUMN IF NOT EXISTS,
    so we check existing columns manually before altering.
    """
    migrations = [
        ("users", "name",        "ALTER TABLE users ADD COLUMN name TEXT"),
        ("users", "google_id",   "ALTER TABLE users ADD COLUMN google_id TEXT"),
    ]

    with engine.connect() as conn:
        for table, column, sql in migrations:
            try:
                # Fetch current columns for the table
                result = conn.execute(text(f"PRAGMA table_info({table})"))
                existing_cols = [row[1] for row in result.fetchall()]
                if column not in existing_cols:
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"[migration] Added column '{column}' to '{table}'")
            except Exception as e:
                print(f"[migration] Skipping '{column}' on '{table}': {e}")
