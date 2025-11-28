"""
FastAPI backend for SmartLivingAdvisor powered by Neon data.

This service exposes lightweight endpoints for the React experience,
pulling live rows from the `real_estate_data` table hosted on Neon.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import List, Sequence

from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

load_dotenv()


class Listing(BaseModel):
  """Simplified payload consumed by the frontend listings grid."""

  id: int
  title: str
  price: str
  location: str
  area: str
  rooms: str
  score: str
  badge: str
  badge_color: str
  image: str


app = FastAPI(
  title="SmartLivingAdvisor API",
  description="FastAPI backend powering the SmartLivingAdvisor experience.",
  version="0.2.0",
)

# CORS configuration - explicitly allow Vite dev server and production origins
cors_origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
if cors_origins_env:
  allowed_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
else:
  # Default: allow common dev origins
  allowed_origins = [
    "http://localhost:5173",  # Vite default
    "http://localhost:3000",  # Alternative React dev server
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ]

app.add_middleware(
  CORSMiddleware,
  allow_origins=allowed_origins,
  allow_credentials=True,
  allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allow_headers=["*"],
  expose_headers=["*"],
)


def get_engine() -> Engine:
  """Create (and cache) the SQLAlchemy engine."""

  @lru_cache(maxsize=1)
  def _create_engine() -> Engine:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
      raise RuntimeError("DATABASE_URL environment variable is required to query Neon data.")
    return create_engine(database_url, pool_pre_ping=True)

  return _create_engine()


LISTING_IMAGES = [
  "/assets/property_type/Gemini_Generated_Image_eplvsbeplvsbeplv.png",
  "/assets/property_type/Gemini_Generated_Image_fk2om1fk2om1fk2o.png",
  "/assets/property_type/Gemini_Generated_Image_hozu90hozu90hozu.png",
  "/assets/property_type/Gemini_Generated_Image_ksqnxhksqnxhksqn.png",
  "/assets/property_type/Gemini_Generated_Image_r7jqkkr7jqkkr7jq.png",
  "/assets/property_type/Gemini_Generated_Image_x9pl10x9pl10x9pl.png",
]


LISTING_QUERY = """
SELECT
  no,
  property_type,
  price,
  location,
  COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
  num_rooms,
  num_bathrooms,
  smart_living_score
FROM public.real_estate_data
WHERE price IS NOT NULL
  AND location IS NOT NULL
  {city_clause}
ORDER BY smart_living_score DESC NULLS LAST, price ASC
LIMIT :limit
"""


def _format_price(price: float | int | None) -> str:
  if price is None:
    return "Price on request"
  return f"${price:,.0f}"


def _format_area(area_m2: float | None) -> str:
  if not area_m2:
    return "—"
  sqft = area_m2 * 10.7639
  return f"{sqft:,.0f} sq ft"


def _format_rooms(num_rooms: int | None, num_bathrooms: int | None) -> str:
  beds = f"{int(num_rooms)} Bed" if num_rooms is not None else "Beds N/A"
  baths = f"{int(num_bathrooms)} Bath" if num_bathrooms is not None else "Bath N/A"
  return f"{beds} • {baths}"


def _badge_for_score(score: float | None) -> tuple[str, str]:
  if score is None:
    return "New Listing", "#F4A340"
  if score >= 90:
    return "Excellent Match", "#52D1C6"
  if score >= 85:
    return "High Score", "#2D9CDB"
  return "New Listing", "#EF6C48"


def _rows_to_listings(rows: Sequence[dict], limit: int) -> List[Listing]:
  listings: List[Listing] = []
  for idx, row in enumerate(rows):
    score_value = row.get("smart_living_score")
    badge_label, badge_color = _badge_for_score(score_value)
    listings.append(
      Listing(
        id=int(row["no"]),
        title=(row.get("property_type") or "Smart Home").title(),
        price=_format_price(row.get("price")),
        location=str(row.get("location") or "Unknown"),
        area=_format_area(row.get("floor_area_m2")),
        rooms=_format_rooms(row.get("num_rooms"), row.get("num_bathrooms")),
        score=f"{int(score_value):d} Smart Score" if score_value is not None else "Smart score coming soon",
        badge=badge_label,
        badge_color=badge_color,
        image=LISTING_IMAGES[idx % len(LISTING_IMAGES)],
      )
    )
  # If Neon returned fewer than requested, still ensure we fill at least one listing
  if not listings:
    listings.append(
      Listing(
        id=0,
        title="SmartLiving Showcase Home",
        price="Pricing soon",
        location="Your next neighborhood",
        area="—",
        rooms="—",
        score="Smart score coming soon",
        badge="New Listing",
        badge_color="#F4A340",
        image=LISTING_IMAGES[0],
      )
    )
  return listings[:limit]


@app.get("/health", tags=["system"])
def healthcheck() -> dict[str, str]:
  """Basic health endpoint for uptime checks."""

  return {"status": "ok", "service": "smartlivingadvisor-api"}


@app.get("/listings", response_model=List[Listing], tags=["listings"])
def list_listings(
  city: str | None = Query(default=None, description="Filter by city or neighborhood"),
  limit: int = Query(default=6, ge=1, le=24),
) -> List[Listing]:
  """Return featured listings fetched directly from Neon."""

  try:
    engine = get_engine()
    city_clause = "AND LOWER(location) LIKE :city_pattern" if city else ""
    stmt = text(LISTING_QUERY.format(city_clause=city_clause))

    params: dict[str, object] = {"limit": limit}
    if city:
      params["city_pattern"] = f"%{city.lower()}%"

    with engine.connect() as conn:
      rows = conn.execute(stmt, params).mappings().all()

    return _rows_to_listings(rows, limit)
  except Exception as e:
    # Log error but still return empty/fallback listings so CORS headers are sent
    import logging
    logging.error(f"Error fetching listings: {e}", exc_info=True)
    # Return empty list rather than raising to ensure CORS headers are sent
    return []

