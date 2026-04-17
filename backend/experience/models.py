from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float
from sqlalchemy.sql import func
from authentication.database import Base


class ExperiencePost(Base):
    __tablename__ = "experience_posts"

    id = Column(Integer, primary_key=True, index=True)
    # Author (optional — nullable for anonymous posts)
    user_id = Column(Integer, nullable=True, index=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)

    # Company info
    company = Column(String(200), nullable=False, index=True)
    role = Column(String(200), nullable=False, index=True)
    offer_date = Column(String(20), nullable=True)  # stored as YYYY-MM
    ctc = Column(String(100), nullable=True)        # e.g. "12 LPA", "2000 USD/mo"

    # Interview rounds
    rounds_count = Column(Integer, default=0)
    rounds_detail = Column(JSON, nullable=True)     # [{round_name, difficulty, description}]

    # Content
    tips = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)              # ["DSA", "System Design", ...]

    # Moderation
    is_verified = Column(Boolean, default=False, nullable=False)
    upvotes = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
