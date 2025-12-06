"""
FastAPI backend for SmartLivingAdvisor powered by Neon data.

This service exposes lightweight endpoints for the React experience,
pulling live rows from the `real_estate_data` table hosted on Neon.
"""

from __future__ import annotations

import os
import logging
import math
from functools import lru_cache
from typing import List, Sequence

import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.routers import auth, user

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

# Register routers
app.include_router(auth.router)
app.include_router(user.router)


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

SEARCH_QUERY = """
SELECT
  no,
  property_type,
  price,
  location,
  latitude,
  longitude,
  COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
  num_rooms,
  num_bathrooms,
  smart_living_score
FROM public.real_estate_data
WHERE price IS NOT NULL
  AND location IS NOT NULL
  {search_clause}
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


def _haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
  """Approximate distance in miles between two coordinates."""

  # Convert degrees to radians
  lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(math.radians, [lat1, lon1, lat2, lon2])
  dlat = lat2_rad - lat1_rad
  dlon = lon2_rad - lon1_rad

  a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
  c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

  earth_radius_miles = 3958.8
  return earth_radius_miles * c


def _extract_city_from_location(location_str: str | None) -> str | None:
  if not location_str:
    return None
  if "," in location_str:
    return location_str.split(",")[-1].strip()
  return location_str.split()[-1] if location_str else None


def _build_fallback_places(types_param: str) -> List[Place]:
  requested_types = [t for t in types_param.split(",") if t]
  categories = [c for c in DEFAULT_PLACE_CATEGORIES if not requested_types or c[0] in requested_types]
  if not categories:
    categories = DEFAULT_PLACE_CATEGORIES

  return [
    Place(
      name=f"{label} nearby",
      rating=4.6,
      distance="Within 2 mi",
      types=[type_key],
      icon=icon,
    )
    for type_key, label, icon in categories
  ]


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


@app.get("/api/properties", response_model=List[Listing], tags=["properties"])
def api_list_properties(
  city: str | None = Query(default=None, description="Filter by city or neighborhood"),
  limit: int = Query(default=6, ge=1, le=24),
) -> List[Listing]:
  """Alias of /listings for the frontend /api namespace."""

  return list_listings(city=city, limit=limit)


class SearchProperty(BaseModel):
  """Property model for search results with map coordinates."""
  no: int
  property_type: str | None
  price: float | int | None
  location: str
  latitude: float | None
  longitude: float | None
  num_rooms: int | None
  num_bathrooms: int | None
  floor_area_m2: float | None
  smart_living_score: float | None


class Place(BaseModel):
  """Nearby place/point of interest."""

  name: str
  rating: float | None = None
  distance: str | None = None
  types: List[str] | None = None
  icon: str | None = None


DEFAULT_PLACE_CATEGORIES = [
  ("school", "Schools", "🎓"),
  ("hospital", "Hospitals", "🏥"),
  ("restaurant", "Restaurants", "🍴"),
  ("grocery_or_supermarket", "Grocery Stores", "🛒"),
  ("park", "Parks", "🌳"),
  ("transit_station", "Transit Stations", "🚌"),
]


def _rows_to_search_properties(rows: Sequence[dict]) -> List[SearchProperty]:
  """Convert DB rows into SearchProperty objects."""

  results: List[SearchProperty] = []
  for row in rows:
    results.append(
      SearchProperty(
        no=int(row["no"]),
        property_type=row.get("property_type"),
        price=row.get("price"),
        location=str(row.get("location") or "Unknown"),
        latitude=float(row["latitude"]) if row.get("latitude") is not None else None,
        longitude=float(row["longitude"]) if row.get("longitude") is not None else None,
        num_rooms=row.get("num_rooms"),
        num_bathrooms=row.get("num_bathrooms"),
        floor_area_m2=float(row["floor_area_m2"]) if row.get("floor_area_m2") is not None else None,
        smart_living_score=float(row["smart_living_score"]) if row.get("smart_living_score") is not None else None,
      )
    )

  return results


class PropertyDetail(SearchProperty):
  """Extended property model for the PDP."""
  description: str | None = None
  amenities: str | None = None
  images: List[str] | None = None
  city: str | None = None
  address: str | None = None


@app.get("/search", response_model=List[SearchProperty], tags=["search"])
def search_properties(
  query: str = Query(default="", description="Search query for location, city, or neighborhood"),
  property_type: str | None = Query(default=None, description="Filter by property type"),
  min_price: int | None = Query(default=None, ge=0, description="Minimum price"),
  max_price: int | None = Query(default=None, ge=0, description="Maximum price"),
  min_beds: int | None = Query(default=None, ge=0, description="Minimum bedrooms"),
  min_baths: int | None = Query(default=None, ge=0, description="Minimum bathrooms"),
  has_gym: bool | None = Query(default=None, description="Has gym"),
  has_parking: bool | None = Query(default=None, description="Has parking"),
  has_pool: bool | None = Query(default=None, description="Has pool"),
  amenities_contains: str | None = Query(default=None, description="Amenities contains text"),
  air_conditioning: bool | None = Query(default=None, description="Has air conditioning"),
  heating: bool | None = Query(default=None, description="Has heating"),
  min_dist_hospital: float | None = Query(default=None, ge=0, description="Minimum distance to hospital"),
  max_dist_hospital: float | None = Query(default=None, ge=0, description="Maximum distance to hospital"),
  min_dist_school: float | None = Query(default=None, ge=0, description="Minimum distance to school"),
  max_dist_school: float | None = Query(default=None, ge=0, description="Maximum distance to school"),
  min_dist_bus: float | None = Query(default=None, ge=0, description="Minimum distance to bus"),
  max_dist_bus: float | None = Query(default=None, ge=0, description="Maximum distance to bus"),
  min_crime_rate: float | None = Query(default=None, ge=0, description="Minimum crime rate"),
  max_crime_rate: float | None = Query(default=None, ge=0, description="Maximum crime rate"),
  min_score: float | None = Query(default=None, ge=0, le=100, description="Minimum Smart Living Score"),
  max_score: float | None = Query(default=None, ge=0, le=100, description="Maximum Smart Living Score"),
  smart_label: str | None = Query(default=None, description="Smart label (Excellent, Good, Fair, Poor)"),
  min_transport_score: float | None = Query(default=None, ge=0, description="Minimum transport score"),
  max_transport_score: float | None = Query(default=None, ge=0, description="Maximum transport score"),
  min_population: int | None = Query(default=None, ge=0, description="Minimum population"),
  max_population: int | None = Query(default=None, ge=0, description="Maximum population"),
  min_income: float | None = Query(default=None, ge=0, description="Minimum income"),
  max_income: float | None = Query(default=None, ge=0, description="Maximum income"),
  min_price_to_income: float | None = Query(default=None, ge=0, description="Minimum price-to-income ratio"),
  max_price_to_income: float | None = Query(default=None, ge=0, description="Maximum price-to-income ratio"),
  hqs_pass_only: bool | None = Query(default=None, description="HQS pass only"),
  min_hqs_score: float | None = Query(default=None, ge=0, description="Minimum HQS score"),
  max_hqs_score: float | None = Query(default=None, ge=0, description="Maximum HQS score"),
  sort_by: str = Query(default="score", description="Sort by: score, price_asc, price_desc"),
  limit: int = Query(default=50, ge=1, le=100),
) -> List[SearchProperty]:
  """Search properties with filters. Returns results with coordinates for map display."""

  try:
    engine = get_engine()
    
    # Build WHERE clause
    conditions = ["price IS NOT NULL", "location IS NOT NULL"]
    params: dict[str, object] = {"limit": limit}
    
    if query:
      conditions.append("(LOWER(location) LIKE :search_pattern OR LOWER(property_type) LIKE :search_pattern)")
      params["search_pattern"] = f"%{query.lower()}%"
    
    if property_type:
      conditions.append("LOWER(property_type) = :property_type")
      params["property_type"] = property_type.lower()
    
    if min_price is not None:
      conditions.append("price >= :min_price")
      params["min_price"] = min_price
    
    if max_price is not None:
      conditions.append("price <= :max_price")
      params["max_price"] = max_price
    
    if min_beds is not None:
      conditions.append("num_rooms >= :min_beds")
      params["min_beds"] = min_beds
    
    if min_baths is not None:
      conditions.append("num_bathrooms >= :min_baths")
      params["min_baths"] = min_baths
    
    if has_gym is not None:
      conditions.append("has_gym = :has_gym")
      params["has_gym"] = has_gym
    
    if has_parking is not None:
      conditions.append("has_parking = :has_parking")
      params["has_parking"] = has_parking
    
    if has_pool is not None:
      conditions.append("has_pool = :has_pool")
      params["has_pool"] = has_pool
    
    if min_score is not None:
      conditions.append("smart_living_score >= :min_score")
      params["min_score"] = min_score
    
    if max_score is not None:
      conditions.append("smart_living_score <= :max_score")
      params["max_score"] = max_score
    
    if smart_label:
      conditions.append("LOWER(smart_label) = :smart_label")
      params["smart_label"] = smart_label.lower()
    
    if amenities_contains:
      conditions.append("LOWER(amenities) LIKE :amenities_contains")
      params["amenities_contains"] = f"%{amenities_contains.lower()}%"
    
    if air_conditioning is not None:
      conditions.append("air_conditioning = :air_conditioning")
      params["air_conditioning"] = air_conditioning
    
    if heating is not None:
      conditions.append("heating = :heating")
      params["heating"] = heating
    
    if min_dist_hospital is not None:
      conditions.append("dist_hospital >= :min_dist_hospital")
      params["min_dist_hospital"] = min_dist_hospital
    
    if max_dist_hospital is not None:
      conditions.append("dist_hospital <= :max_dist_hospital")
      params["max_dist_hospital"] = max_dist_hospital
    
    if min_dist_school is not None:
      conditions.append("dist_school >= :min_dist_school")
      params["min_dist_school"] = min_dist_school
    
    if max_dist_school is not None:
      conditions.append("dist_school <= :max_dist_school")
      params["max_dist_school"] = max_dist_school
    
    if min_dist_bus is not None:
      conditions.append("dist_bus >= :min_dist_bus")
      params["min_dist_bus"] = min_dist_bus
    
    if max_dist_bus is not None:
      conditions.append("dist_bus <= :max_dist_bus")
      params["max_dist_bus"] = max_dist_bus
    
    if min_crime_rate is not None:
      conditions.append("crime_rate >= :min_crime_rate")
      params["min_crime_rate"] = min_crime_rate
    
    if max_crime_rate is not None:
      conditions.append("crime_rate <= :max_crime_rate")
      params["max_crime_rate"] = max_crime_rate
    
    if min_transport_score is not None:
      conditions.append("transport_score >= :min_transport_score")
      params["min_transport_score"] = min_transport_score
    
    if max_transport_score is not None:
      conditions.append("transport_score <= :max_transport_score")
      params["max_transport_score"] = max_transport_score
    
    if min_population is not None:
      conditions.append("population >= :min_population")
      params["min_population"] = min_population
    
    if max_population is not None:
      conditions.append("population <= :max_population")
      params["max_population"] = max_population
    
    if min_income is not None:
      conditions.append("income >= :min_income")
      params["min_income"] = min_income
    
    if max_income is not None:
      conditions.append("income <= :max_income")
      params["max_income"] = max_income
    
    if min_price_to_income is not None:
      conditions.append("price_to_income_ratio >= :min_price_to_income")
      params["min_price_to_income"] = min_price_to_income
    
    if max_price_to_income is not None:
      conditions.append("price_to_income_ratio <= :max_price_to_income")
      params["max_price_to_income"] = max_price_to_income
    
    if hqs_pass_only is not None:
      conditions.append("_hqs_pass_boolean = :hqs_pass_only")
      params["hqs_pass_only"] = hqs_pass_only
    
    if min_hqs_score is not None:
      conditions.append("hqs_score >= :min_hqs_score")
      params["min_hqs_score"] = min_hqs_score
    
    if max_hqs_score is not None:
      conditions.append("hqs_score <= :max_hqs_score")
      params["max_hqs_score"] = max_hqs_score
    
    where_clause = " AND ".join(conditions)
    
    # Build ORDER BY clause
    if sort_by == "price_asc":
      order_by = "price ASC"
    elif sort_by == "price_desc":
      order_by = "price DESC"
    else:  # default: score
      order_by = "smart_living_score DESC NULLS LAST, price ASC"
    
    query_sql = f"""
    SELECT
      no,
      property_type,
      price,
      location,
      latitude,
      longitude,
      COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
      num_rooms,
      num_bathrooms,
      smart_living_score
    FROM public.real_estate_data
    WHERE {where_clause}
    ORDER BY {order_by}
    LIMIT :limit
    """
    
    stmt = text(query_sql)

    with engine.connect() as conn:
      rows = conn.execute(stmt, params).mappings().all()

    return _rows_to_search_properties(rows)
  except Exception as e:
    import logging
    logging.error(f"Error searching properties: {e}", exc_info=True)
    return []


@app.get("/property/{property_id}", response_model=PropertyDetail, tags=["properties"])
def get_property(property_id: int) -> PropertyDetail:
  """Return a single property by its listing number."""

  try:
    engine = get_engine()

    query_sql = """
    SELECT
      no,
      property_type,
      price,
      location,
      latitude,
      longitude,
      COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
      num_rooms,
      num_bathrooms,
      smart_living_score,
      amenities
    FROM public.real_estate_data
    WHERE no = :property_id
    LIMIT 1
    """

    with engine.connect() as conn:
      row = conn.execute(text(query_sql), {"property_id": property_id}).mappings().first()

    if not row:
      raise HTTPException(status_code=404, detail="Property not found")

    location_str = str(row.get("location") or "Unknown")
    # Try to extract city from location (assume it's the last part after comma, or the whole string)
    city = None
    if "," in location_str:
      city = location_str.split(",")[-1].strip()
    else:
      city = location_str.split()[-1] if location_str else None

    # Generate images array based on property type
    property_type = row.get("property_type") or ""
    images = LISTING_IMAGES.copy()  # Use all available images for the gallery

    return PropertyDetail(
      no=int(row["no"]),
      property_type=row.get("property_type"),
      price=row.get("price"),
      location=location_str,
      latitude=float(row["latitude"]) if row.get("latitude") is not None else None,
      longitude=float(row["longitude"]) if row.get("longitude") is not None else None,
      num_rooms=row.get("num_rooms"),
      num_bathrooms=row.get("num_bathrooms"),
      floor_area_m2=float(row["floor_area_m2"]) if row.get("floor_area_m2") is not None else None,
      smart_living_score=float(row["smart_living_score"]) if row.get("smart_living_score") is not None else None,
      description=None,  # Description column doesn't exist in database
      amenities=row.get("amenities"),
      images=images,
      city=city,
      address=location_str,
    )
  except HTTPException:
    raise
  except Exception as e:
    import logging
    logging.error(f"Error loading property {property_id}: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Unable to load property")


@app.get("/api/properties/{id}", response_model=PropertyDetail, tags=["properties"])
def get_property_by_id(id: int) -> PropertyDetail:
  """Return a single property by its listing number (API endpoint for frontend)."""
  # Delegate to the main property endpoint
  return get_property(id)


@app.get("/api/properties/similar", response_model=List[SearchProperty], tags=["properties"])
def get_similar_properties(
  id: int = Query(..., description="Base property id to compare"),
  limit: int = Query(default=6, ge=1, le=24),
) -> List[SearchProperty]:
  """Return properties similar to the provided id using location, type, and price."""

  try:
    engine = get_engine()

    with engine.connect() as conn:
      base_row = conn.execute(
        text(
          """
          SELECT price, location, property_type
          FROM public.real_estate_data
          WHERE no = :id
          LIMIT 1
          """
        ),
        {"id": id},
      ).mappings().first()

    if not base_row:
      return []

    conditions = ["no != :id", "price IS NOT NULL", "location IS NOT NULL"]
    params: dict[str, object] = {"id": id, "limit": limit}

    price = base_row.get("price")
    if price is not None:
      params["min_price"] = float(price) * 0.8
      params["max_price"] = float(price) * 1.2
      conditions.append("price BETWEEN :min_price AND :max_price")

    property_type = base_row.get("property_type")
    if property_type:
      params["property_type"] = str(property_type).lower()
      conditions.append("LOWER(property_type) = :property_type")

    city = _extract_city_from_location(base_row.get("location"))
    if city:
      params["city_pattern"] = f"%{city.lower()}%"
      conditions.append("LOWER(location) LIKE :city_pattern")

    where_clause = " AND ".join(conditions)

    query_sql = f"""
    SELECT
      no,
      property_type,
      price,
      location,
      latitude,
      longitude,
      COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
      num_rooms,
      num_bathrooms,
      smart_living_score
    FROM public.real_estate_data
    WHERE {where_clause}
    ORDER BY smart_living_score DESC NULLS LAST, price ASC
    LIMIT :limit
    """

    with engine.connect() as conn:
      rows = conn.execute(text(query_sql), params).mappings().all()

    return _rows_to_search_properties(rows)
  except Exception as e:
    logging.error(f"Error fetching similar properties for {id}: {e}", exc_info=True)
    return []


@app.get("/api/properties/nearby", response_model=List[SearchProperty], tags=["properties"])
def get_nearby_properties(
  lat: float = Query(..., description="Latitude of the reference point"),
  lng: float = Query(..., description="Longitude of the reference point"),
  radius: float = Query(default=10, ge=0.1, le=100, description="Search radius in miles"),
  limit: int = Query(default=12, ge=1, le=50),
) -> List[SearchProperty]:
  """Return properties within a simple bounding box around the given coordinate."""

  try:
    engine = get_engine()

    delta_lat = radius / 69.0
    cos_lat = max(math.cos(math.radians(lat)), 0.1)
    delta_lng = radius / (69.0 * cos_lat)

    query_sql = """
    SELECT
      no,
      property_type,
      price,
      location,
      latitude,
      longitude,
      COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
      num_rooms,
      num_bathrooms,
      smart_living_score
    FROM public.real_estate_data
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND ABS(latitude - :lat) <= :delta_lat
      AND ABS(longitude - :lng) <= :delta_lng
    ORDER BY smart_living_score DESC NULLS LAST, price ASC
    LIMIT :limit
    """

    params = {
      "lat": lat,
      "lng": lng,
      "delta_lat": delta_lat,
      "delta_lng": delta_lng,
      "limit": limit,
    }

    with engine.connect() as conn:
      rows = conn.execute(text(query_sql), params).mappings().all()

    return _rows_to_search_properties(rows)
  except Exception as e:
    logging.error(f"Error fetching nearby properties for {lat},{lng}: {e}", exc_info=True)
    return []


@app.get("/api/places/nearby", response_model=List[Place], tags=["places"])
def get_nearby_places(
  lat: float = Query(..., description="Latitude for nearby search"),
  lng: float = Query(..., description="Longitude for nearby search"),
  radius: int = Query(default=2500, ge=100, le=50000, description="Search radius in meters"),
  types: str = Query(default="", description="Comma-separated list of place types"),
) -> List[Place]:
  """Lightweight proxy for Google Places with graceful fallbacks."""

  api_key = os.getenv("GOOGLE_MAPS_API_KEY") or os.getenv("VITE_GOOGLE_MAPS_API_KEY")

  if lat is None or lng is None:
    return _build_fallback_places(types)

  if not api_key:
    return _build_fallback_places(types)

  try:
    params = {
      "location": f"{lat},{lng}",
      "radius": radius,
      "key": api_key,
    }

    type_list = [t for t in types.split(",") if t]
    if type_list:
      params["type"] = type_list[0]

    with httpx.Client(timeout=10.0) as client:
      response = client.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json", params=params)

    if response.status_code != 200:
      logging.error("Places request failed with status %s", response.status_code)
      return _build_fallback_places(types)

    data = response.json()
    results = data.get("results") or []

    places: List[Place] = []
    for place in results[:18]:
      distance_label = "Within 2 mi"
      geometry = place.get("geometry", {}) or {}
      location = geometry.get("location") or {}
      if "lat" in location and "lng" in location:
        try:
          miles = _haversine_miles(lat, lng, float(location["lat"]), float(location["lng"]))
          distance_label = f"{miles:.1f} mi"
        except Exception:
          distance_label = "Within 2 mi"

      places.append(
        Place(
          name=place.get("name") or "Point of interest",
          rating=place.get("rating"),
          distance=distance_label,
          types=place.get("types"),
          icon=None,
        )
      )

    return places or _build_fallback_places(types)
  except Exception as e:
    logging.error(f"Error looking up nearby places: {e}", exc_info=True)
    return _build_fallback_places(types)

