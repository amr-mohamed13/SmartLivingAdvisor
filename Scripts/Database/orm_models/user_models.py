from sqlalchemy import Column, Integer, Float, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    # Primary ID
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Email authentication
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)  # nullable if signing in with OAuth
    name = Column(String(255), nullable=True)

    # OAuth fields (unified approach)
    oauth_provider = Column(String(50), nullable=True)  # "google", "facebook", "apple"
    oauth_id = Column(String(255), nullable=True)  # Provider's user ID

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

            

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    preferred_city = Column(String(100))
    max_budget = Column(Float)
    min_rooms = Column(Integer)
    prefers_gym = Column(Boolean)
    prefers_pool = Column(Boolean)
    prefers_parking = Column(Boolean)


class UserInteraction(Base):
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    property_id = Column(Integer, nullable=False)  # Changed from property_no to property_id for consistency
    interaction_type = Column(String(50), nullable=False)  # "saved", "viewed", "contacted_agent"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SavedProperties(Base):
    __tablename__ = "saved_properties"

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    property_no = Column(Integer, primary_key=True)
    saved_at = Column(TIMESTAMP, server_default=func.now())


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    token = Column(String(512), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)
