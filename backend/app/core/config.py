"""Application configuration.

Settings are loaded from environment variables (and an optional ``.env`` file)
using pydantic-settings. Defaults mirror the values already used by the
ingestion pipeline (see ``backend/ingest.py``) so the auth service and the
existing tooling talk to the same PostgreSQL instance.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict
from typing_extensions import Annotated


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──
    PROJECT_NAME: str = "Graph Intelligence & Security Service"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # ── Database ──
    # Reuses the same variable name as the ingestion pipeline for consistency.
    POSTGRES_URI: str = "postgresql://user:password@localhost:5432/crimerakshak"

    # ── JWT / Auth ──
    # SECRET_KEY MUST be overridden in production via the environment.
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION_use_openssl_rand_hex_32"
    CLERK_SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # Issued-at leeway (seconds) tolerated when validating tokens.
    JWT_LEEWAY_SECONDS: int = 10

    # ── Neo4j (Graph Intelligence) ──
    # Same variable names as the ingestion pipeline (see backend/ingest.py) so
    # the API and the loaders talk to the same graph database.
    USE_NEO4J: bool = True
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    # Cap on nodes/edges returned by traversal endpoints (guards huge payloads).
    GRAPH_MAX_NODES: int = 500
    GRAPH_DEFAULT_LIMIT: int = 100
    # Max hops permitted for full-network traversal and path search.
    GRAPH_MAX_DEPTH: int = 5

    # ── LLM provider ──
    # "gemini" (Google Generative Language, OpenAI-compat) or "openrouter".
    LLM_PROVIDER: str = "gemini"

    # OpenRouter (used when LLM_PROVIDER == "openrouter").
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Google Gemini (used when LLM_PROVIDER == "gemini").
    GEMINI_API_KEY: str = ""
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    # Model used for tool-calling / reasoning (agent core).
    LLM_AGENT_MODEL: str = "gemini-flash-lite-latest"
    # Model used for fluent answer/summary generation (Kannada-capable).
    LLM_SUMMARY_MODEL: str = "gemini-flash-lite-latest"
    # Cap on output tokens per call (keeps cost bounded on metered accounts).
    LLM_MAX_TOKENS: int = 1024

    # ── CSV analytics (DuckDB) ──
    # Directory holding the KSP CSV datasets and the on-disk DuckDB file.
    DATASETS_DIR: str = "../datasets"
    DUCKDB_PATH: str = "crime_stats.duckdb"

    # ── Security policy ──
    PASSWORD_MIN_LENGTH: int = 8
    # Wrong-password attempts before an account is temporarily locked.
    MAX_FAILED_LOGIN_ATTEMPTS: int = 5
    ACCOUNT_LOCKOUT_MINUTES: int = 15

    # ── CORS ──
    # Comma-separated list in the environment, e.g. "http://localhost:3000".
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:3000"]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_cors(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def sqlalchemy_database_uri(self) -> str:
        """SQLAlchemy expects the ``postgresql+psycopg2`` driver prefix."""
        uri = self.POSTGRES_URI
        if uri.startswith("postgresql://"):
            uri = uri.replace("postgresql://", "postgresql+psycopg2://", 1)
        
        # Remove pgbouncer=true because psycopg2 doesn't support it in the DSN
        uri = uri.replace("?pgbouncer=true&", "?")
        uri = uri.replace("?pgbouncer=true", "")
        uri = uri.replace("&pgbouncer=true", "")
        
        return uri


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
