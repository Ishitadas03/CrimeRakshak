"""SQLAlchemy engine, session factory, and declarative base."""
from collections.abc import Generator
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

logger = logging.getLogger("database")


class Base(DeclarativeBase):
    """Declarative base shared by every ORM model."""


def _init_engine():
    try:
        eng = create_engine(
            settings.sqlalchemy_database_uri,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            future=True,
        )
        with eng.connect() as conn:
            pass
        return eng
    except Exception as e:
        logger.warning(
            f"PostgreSQL connection failed ({e}). Falling back to local SQLite database."
        )
        sqlite_uri = "sqlite:///./crimerakshak.db"
        eng = create_engine(sqlite_uri, connect_args={"check_same_thread": False})
        import app.models.rbac  # ensure models are loaded
        Base.metadata.create_all(bind=eng)
        return eng


engine = _init_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    future=True,
)


def get_db() -> Generator:
    """FastAPI dependency that yields a request-scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

