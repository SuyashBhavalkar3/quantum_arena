import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hireflow.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    """Create tables if they don't exist"""
    from . import models
    from resume_parsing import models as resume_models
    from candidate_profile import models as candidate_models
    from job_management_module import models as job_models
    from applications import models as app_models
    from assessment import models as assessment_models
    from notifications import models as notif_models
    from reports import models as report_models
    from recruitment_strategy import models as recruitment_strategy_models
    from experience import models as experience_models
    from voice_analysis import models as voice_analysis_models
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
