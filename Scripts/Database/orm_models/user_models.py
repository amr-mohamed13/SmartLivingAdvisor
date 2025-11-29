from sqlalchemy import Column, Integer, Float, String, Boolean, TIMESTAMP, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    # Primary ID
    id = Column(Integer, primary_key=True, autoincrement=True)

    # Email authentication
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=True)  # nullable if signing in with Google/Apple

    # Social login IDs
    google_id = Column(String(255), unique=True, nullable=True)
    apple_id = Column(String(255), unique=True, nullable=True)
    facebook_id = Column(String(255), unique=True, nullable=True)

    # Authentication method
    # Values: "email", "google", "facebook", "apple", "mixed"
    auth_provider = Column(String(50), default="email")

    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())

            

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
    user_id = Column(Integer, ForeignKey('users.id'))
    property_no = Column(Integer)
    interaction_type = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())


class SavedProperties(Base):
    __tablename__ = "saved_properties"

    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    property_no = Column(Integer, primary_key=True)
    saved_at = Column(TIMESTAMP, server_default=func.now())
