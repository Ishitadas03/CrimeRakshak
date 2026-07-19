from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(str(settings.POSTGRES_URI))
with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN clerk_id VARCHAR(100);"))
        conn.execute(text("CREATE UNIQUE INDEX ix_users_clerk_id ON users(clerk_id);"))
        print("Successfully added clerk_id column!")
    except Exception as e:
        print(f"Error: {e}")
