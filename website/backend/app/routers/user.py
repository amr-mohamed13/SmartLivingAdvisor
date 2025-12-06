"""
User interaction routes for saving/viewing properties.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


def get_engine() -> Engine:
    """Get database engine."""
    import os
    from dotenv import load_dotenv
    load_dotenv()
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL environment variable is required.")
    return create_engine(database_url, pool_pre_ping=True)


# Request/Response Models
class SavePropertyRequest(BaseModel):
    property_id: int


class PropertyInteraction(BaseModel):
    property_id: int
    interaction_type: str
    created_at: str


class UserProfile(BaseModel):
    id: int
    email: str
    name: Optional[str]
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


def ensure_profile_columns(conn) -> None:
    """Ensure optional profile fields exist without breaking deployments."""
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT"))
    conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT"))


@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    engine = get_engine()
    with engine.connect() as conn:
        ensure_profile_columns(conn)
        result = conn.execute(
            text(
                "SELECT id, email, name, phone, avatar_url FROM users WHERE id = :user_id"
            ),
            {"user_id": current_user["id"]},
        ).mappings().first()

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserProfile(**dict(result))


@router.patch("/update", response_model=UserProfile)
async def update_profile(
    payload: UpdateProfileRequest, current_user: dict = Depends(get_current_user)
):
    engine = get_engine()
    with engine.connect() as conn:
        ensure_profile_columns(conn)
        conn.execute(
            text(
                """
                UPDATE users
                SET name = COALESCE(:name, name),
                    phone = COALESCE(:phone, phone),
                    avatar_url = COALESCE(:avatar_url, avatar_url)
                WHERE id = :user_id
                """
            ),
            {
                "name": payload.name,
                "phone": payload.phone,
                "avatar_url": payload.avatar_url,
                "user_id": current_user["id"],
            },
        )
        conn.commit()

        result = conn.execute(
            text("SELECT id, email, name, phone, avatar_url FROM users WHERE id = :user_id"),
            {"user_id": current_user["id"]},
        ).mappings().first()

    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserProfile(**dict(result))


class SavedPropertyResponse(BaseModel):
    property_id: int
    saved_at: str


@router.post("/save-property")
async def save_property(
    request: SavePropertyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a property for the current user."""
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
        # Check if already saved
        existing = conn.execute(
            text("""
                SELECT user_id FROM saved_properties
                WHERE user_id = :user_id AND property_no = :property_id
            """),
            {"user_id": user_id, "property_id": request.property_id}
        ).mappings().first()
        
        if existing:
            return {"message": "Property already saved"}
        
        # Save property
        conn.execute(
            text("""
                INSERT INTO saved_properties (user_id, property_no)
                VALUES (:user_id, :property_id)
            """),
            {"user_id": user_id, "property_id": request.property_id}
        )
        
        # Log interaction
        conn.execute(
            text("""
                INSERT INTO user_interactions (user_id, property_id, interaction_type)
                VALUES (:user_id, :property_id, 'saved')
            """),
            {"user_id": user_id, "property_id": request.property_id}
        )
        
        conn.commit()
    
    return {"message": "Property saved successfully"}


@router.delete("/save-property/{property_id}")
async def unsave_property(
    property_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove a saved property."""
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
        conn.execute(
            text("""
                DELETE FROM saved_properties
                WHERE user_id = :user_id AND property_no = :property_id
            """),
            {"user_id": user_id, "property_id": property_id}
        )
        conn.commit()
    
    return {"message": "Property removed from saved"}


@router.post("/view-property")
async def view_property(
    request: SavePropertyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Log that a user viewed a property."""
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO user_interactions (user_id, property_id, interaction_type)
                VALUES (:user_id, :property_id, 'viewed')
                ON CONFLICT DO NOTHING
            """),
            {"user_id": user_id, "property_id": request.property_id}
        )
        conn.commit()

    return {"message": "View logged"}


@router.get("/saved")
async def get_saved(current_user: dict = Depends(get_current_user)):
    engine = get_engine()
    user_id = current_user["id"]

    with engine.connect() as conn:
        results = conn.execute(
            text(
                """
                SELECT sp.property_no AS id,
                       sp.created_at AS saved_at,
                       re.price,
                       re.location,
                       re.num_rooms,
                       re.num_bathrooms,
                       re.floor_area_m2,
                       re.smart_living_score,
                       re.property_type
                FROM saved_properties sp
                LEFT JOIN real_estate_data re ON re.no = sp.property_no
                WHERE sp.user_id = :user_id
                ORDER BY sp.created_at DESC
                """
            ),
            {"user_id": user_id},
        ).mappings().all()

    return [dict(row) for row in results]


@router.get("/viewed")
async def get_viewed(current_user: dict = Depends(get_current_user)):
    engine = get_engine()
    user_id = current_user["id"]

    with engine.connect() as conn:
        results = conn.execute(
            text(
                """
                SELECT ui.property_id AS id,
                       ui.created_at,
                       re.price,
                       re.location,
                       re.num_rooms,
                       re.num_bathrooms,
                       re.floor_area_m2,
                       re.smart_living_score,
                       re.property_type
                FROM user_interactions ui
                LEFT JOIN real_estate_data re ON re.no = ui.property_id
                WHERE ui.user_id = :user_id AND ui.interaction_type = 'viewed'
                ORDER BY ui.created_at DESC
                """
            ),
            {"user_id": user_id},
        ).mappings().all()

    return [dict(row) for row in results]


@router.get("/saved-properties", response_model=List[int])
async def get_saved_properties(current_user: dict = Depends(get_current_user)):
    """Get list of saved property IDs for current user."""
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
        results = conn.execute(
            text("SELECT property_no FROM saved_properties WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).mappings().all()
    
    return [row["property_no"] for row in results]


@router.get("/interactions", response_model=List[PropertyInteraction])
async def get_user_interactions(current_user: dict = Depends(get_current_user)):
    """Get all user interactions."""
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
        results = conn.execute(
            text("""
                SELECT property_id, interaction_type, created_at
                FROM user_interactions
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": user_id}
        ).mappings().all()
    
    return [
        PropertyInteraction(
            property_id=row["property_id"],
            interaction_type=row["interaction_type"],
            created_at=row["created_at"].isoformat() if row["created_at"] else ""
        )
        for row in results
    ]

