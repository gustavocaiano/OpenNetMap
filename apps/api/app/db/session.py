from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


engine = None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, expire_on_commit=False)


def init_engine() -> None:
    global engine
    if engine is not None:
        return
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    engine = create_engine(settings.database_url, future=True, connect_args=connect_args)
    SessionLocal.configure(bind=engine)
