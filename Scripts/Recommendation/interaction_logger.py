"""
Interaction Logger Module
-------------------------
Handles:
- Logging user interactions (view, click, save, unsave, like, etc.)
- Preventing duplicates
- Fetching interaction history

Table used: user_interactions
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, insert

from Scripts.Database.db_connection import engine
from Scripts.Database.orm_models.user_models import UserInteractions


# --------------------------------------------------
# Helper: Convert ORM row → dict
# --------------------------------------------------
def _row_to_dict(row: UserInteractions):
    if row is None:
        return None
    return {
        "id": row.id,
        "user_id": row.user_id,
        "property_no": row.property_no,
        "interaction_type": row.interaction_type,
        "created_at": row.created_at,
    }


# --------------------------------------------------
# 1) Log a new interaction
# --------------------------------------------------
def log_interaction(user_id: int, property_no: int, interaction_type: str):
    """
    interaction_type can be:
        "view"
        "click"
        "save"
        "unsave"
        "like"
        "dislike"
        "share"
        "compare"

    Example:
        log_interaction(2, 1503, "view")
    """

    with Session(engine) as session:

        # Create new interaction
        new_log = UserInteractions(
            user_id=user_id,
            property_no=property_no,
            interaction_type=interaction_type,
            created_at=datetime.utcnow()
        )

        session.add(new_log)
        session.commit()

        return _row_to_dict(new_log)


# --------------------------------------------------
# 2) Fetch all interactions of a user
# --------------------------------------------------
def get_user_interactions(user_id: int, limit: int = 50):
    """
    Returns the most recent interactions (default 50)
    """

    with Session(engine) as session:
        stmt = (
            select(UserInteractions)
            .where(UserInteractions.user_id == user_id)
            .order_by(UserInteractions.created_at.desc())
            .limit(limit)
        )

        rows = session.execute(stmt).scalars().all()
        return [_row_to_dict(r) for r in rows]


# --------------------------------------------------
# 3) Fetch interactions for a user + specific property
# --------------------------------------------------
def get_property_interactions(user_id: int, property_no: int):
    with Session(engine) as session:
        stmt = (
            select(UserInteractions)
            .where(
                UserInteractions.user_id == user_id,
                UserInteractions.property_no == property_no
            )
            .order_by(UserInteractions.created_at.desc())
        )

        rows = session.execute(stmt).scalars().all()
        return [_row_to_dict(r) for r in rows]


# --------------------------------------------------
# 4) Count number of views, likes, saves etc.
# --------------------------------------------------
def count_interactions(user_id: int, interaction_type: str):
    """
    Example:
        count_interactions(1, "view")
    """

    with Session(engine) as session:
        stmt = (
            select(UserInteractions)
            .where(
                UserInteractions.user_id == user_id,
                UserInteractions.interaction_type == interaction_type
            )
        )

        rows = session.execute(stmt).scalars().all()
        return len(rows)


# --------------------------------------------------
# 5) Demo run (only when executed directly)
# --------------------------------------------------
if __name__ == "__main__":
    print("Testing Interaction Logger...")

    # Example test
    test_user = 1
    test_property = 101

    print("Logging interaction...")
    log = log_interaction(test_user, test_property, "view")
    print("Logged:", log)

    print("User interactions:")
    print(get_user_interactions(test_user))
