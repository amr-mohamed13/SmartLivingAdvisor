"""
Preference Manager Module
-------------------------
Handles:
- Creating default user preferences
- Updating user preferences
- Fetching preferences for recommendation system
- Checking if preference record exists

Table used: user_preferences
"""

from sqlalchemy.orm import Session
from sqlalchemy import select, update
from datetime import datetime

from Scripts.Database.db_connection import engine
from Scripts.Database.orm_models.user_models import UserPreferences


# --------------------------------------------------
# Helper: Convert ORM row → dictionary
# --------------------------------------------------
def _row_to_dict(row: UserPreferences):
    if row is None:
        return None
    return {
        "user_id": row.user_id,
        "preferred_city": row.preferred_city,
        "max_budget": row.max_budget,
        "min_rooms": row.min_rooms,
        "prefers_gym": row.prefers_gym,
        "prefers_pool": row.prefers_pool,
        "prefers_parking": row.prefers_parking,
    }


# --------------------------------------------------
# 1) Get user preferences
# --------------------------------------------------
def get_user_preferences(user_id: int) -> dict | None:
    with Session(engine) as session:
        stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
        result = session.execute(stmt).scalar_one_or_none()
        return _row_to_dict(result)


# --------------------------------------------------
# 2) Create default preference row for new user
# --------------------------------------------------
def create_default_preferences(user_id: int):
    """
    Default values mean: user has no explicit preference yet.
    The recommender system will rely more on global ranking until user interacts.
    """
    default = UserPreferences(
        user_id=user_id,
        preferred_city=None,
        max_budget=None,
        min_rooms=0,
        prefers_gym=False,
        prefers_pool=False,
        prefers_parking=False,
    )

    with Session(engine) as session:
        session.add(default)
        session.commit()
        return _row_to_dict(default)


# --------------------------------------------------
# 3) Check if user has preference row
# --------------------------------------------------
def preferences_exist(user_id: int) -> bool:
    with Session(engine) as session:
        stmt = select(UserPreferences).where(UserPreferences.user_id == user_id)
        result = session.execute(stmt).scalar_one_or_none()
        return result is not None


# --------------------------------------------------
# 4) Update preferences
# --------------------------------------------------
def update_user_preferences(user_id: int, **kwargs):
    """
    kwargs may include:
        preferred_city="Houston"
        max_budget=1500000
        min_rooms=3
        prefers_gym=True
        prefers_pool=False
        prefers_parking=True
    """

    with Session(engine) as session:
        # If row missing → create it
        if not preferences_exist(user_id):
            create_default_preferences(user_id)

        stmt = (
            update(UserPreferences)
            .where(UserPreferences.user_id == user_id)
            .values(**kwargs)
        )
        session.execute(stmt)
        session.commit()

    return get_user_preferences(user_id)


# --------------------------------------------------
# 5) Demo usage (only if executed directly)
# --------------------------------------------------
if __name__ == "__main__":
    print("Testing Preference Manager...")

    test_user_id = 1

    if not preferences_exist(test_user_id):
        print("Creating default prefs...")
        create_default_preferences(test_user_id)

    print("Updating preferences...")
    updated = update_user_preferences(
        test_user_id,
        preferred_city="Houston",
        max_budget=2000000,
        min_rooms=3,
        prefers_gym=True
    )

    print("Updated preferences:", updated)
