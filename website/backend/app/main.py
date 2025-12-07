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
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
import httpx

from app.routers import auth, user
from app.auth import get_current_user

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
  property_id: int = Query(..., alias="id", description="Property ID to find similar properties for"),
  limit: int = Query(default=6, ge=1, le=20, description="Number of similar properties to return")
) -> List[SearchProperty]:
  """Find similar properties based on price, location, and property type."""
  try:
    engine = get_engine()
    
    # First, get the target property
    target_query = text("""
      SELECT price, property_type, latitude, longitude, num_rooms, num_bathrooms, smart_living_score
      FROM real_estate_data
      WHERE no = :property_id
    """)
    
    with engine.connect() as conn:
      target = conn.execute(target_query, {"property_id": property_id}).mappings().first()
      
      if not target:
        raise HTTPException(status_code=404, detail="Property not found")
      
      target_price = float(target["price"]) if target.get("price") else None
      target_type = target.get("property_type")
      target_lat = float(target["latitude"]) if target.get("latitude") else None
      target_lng = float(target["longitude"]) if target.get("longitude") else None
      
      # Build similarity query
      conditions = ["no != :property_id"]
      params = {"property_id": property_id, "limit": limit + 1}  # +1 to exclude the target
      
      # Similar property type
      if target_type:
        conditions.append("property_type = :property_type")
        params["property_type"] = target_type
      
      # Similar price range (±30%)
      if target_price:
        conditions.append("price BETWEEN :min_price AND :max_price")
        params["min_price"] = target_price * 0.7
        params["max_price"] = target_price * 1.3
      
      # Similar location (within 10km if coordinates available)
      if target_lat and target_lng:
        conditions.append("""
          (6371 * acos(
            cos(radians(:target_lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:target_lng)) +
            sin(radians(:target_lat)) * sin(radians(latitude))
          )) <= 10
        """)
        params["target_lat"] = target_lat
        params["target_lng"] = target_lng
      
      where_clause = " AND ".join(conditions)
      
      # Build safe query
      if not conditions:
        conditions = ["no != :property_id"]
      
      where_clause = " AND ".join(conditions)
      
      # Use COALESCE for floor_area_m2
      similar_query = text(f"""
        SELECT
          no,
          property_type,
          price,
          location,
          latitude,
          longitude,
          num_rooms,
          num_bathrooms,
          COALESCE(floor_area_m2, floor_area) AS floor_area_m2,
          smart_living_score
        FROM real_estate_data
        WHERE {where_clause}
          AND price IS NOT NULL
          AND location IS NOT NULL
        ORDER BY 
          CASE WHEN property_type = :property_type THEN 0 ELSE 1 END,
          ABS(COALESCE(price, 0) - :target_price) ASC,
          COALESCE(smart_living_score, 0) DESC
        LIMIT :limit
      """)
      
      params["target_price"] = target_price or 0
      if "property_type" not in params:
        params["property_type"] = target_type or ""
      
      results = conn.execute(similar_query, params).mappings().all()
    
    similar_properties: List[SearchProperty] = []
    for row in results:
      similar_properties.append(
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
    
    return similar_properties[:limit]
    
  except HTTPException:
    raise
  except Exception as e:
    import logging
    logging.error(f"Error finding similar properties: {e}", exc_info=True)
    return []


@app.get("/api/places/nearby", tags=["places"])
async def get_nearby_places(
  lat: float = Query(..., description="Latitude"),
  lng: float = Query(..., description="Longitude"),
  radius: int = Query(default=2500, ge=100, le=5000, description="Search radius in meters"),
  types: str = Query(default="restaurant", description="Comma-separated place types")
):
  """Proxy endpoint for Google Maps Places API to avoid CORS issues."""
  google_api_key = os.getenv("GOOGLE_MAPS_API_KEY")
  if not google_api_key:
    return {"results": [], "status": "API_KEY_MISSING"}
  
  try:
    # Handle single type or comma-separated types
    type_list = [t.strip() for t in types.split(",") if t.strip()]
    if not type_list:
      return {"results": [], "status": "INVALID_TYPE"}
    
    # Use first type for the API call (Google Places API only accepts one type per request)
    primary_type = type_list[0]
    
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={radius}&type={primary_type}&key={google_api_key}"
    
    async with httpx.AsyncClient() as client:
      response = await client.get(url, timeout=10.0)
      response.raise_for_status()
      data = response.json()
      
      if data.get("status") not in ["OK", "ZERO_RESULTS"]:
        return {"results": [], "status": data.get("status", "ERROR")}
      
      # Format results with geometry for distance calculations
      results = []
      for place in data.get("results", [])[:20]:
        geometry = place.get("geometry", {})
        location = geometry.get("location", {})
        if not location:
          continue
          
        results.append({
          "name": place.get("name", "Unknown"),
          "rating": place.get("rating"),
          "vicinity": place.get("vicinity"),
          "formatted_address": place.get("formatted_address"),
          "types": place.get("types", []),
          "geometry": {
            "location": {
              "lat": location.get("lat"),
              "lng": location.get("lng")
            }
          },
          "opening_hours": place.get("opening_hours", {})
        })
      
      return {"results": results, "status": "OK"}
      
  except httpx.RequestError as e:
    import logging
    logging.error(f"HTTP error fetching places: {e}", exc_info=True)
    return {"results": [], "status": "HTTP_ERROR"}
  except Exception as e:
    import logging
    logging.error(f"Error fetching nearby places: {e}", exc_info=True)
    return {"results": [], "status": "ERROR"}


@app.get("/api/recommendations/{property_id}", response_model=List[SearchProperty], tags=["recommendations"])
async def get_recommendations_by_property(
  property_id: int,
  limit: int = Query(default=6, ge=1, le=20, description="Number of recommendations")
) -> List[SearchProperty]:
  """Get property recommendations based on a specific property using recommender.py logic."""
  try:
    engine = get_engine()
    
    # Get the target property
    target_query = text("""
      SELECT no, property_type, price, latitude, longitude, num_rooms, num_bathrooms,
             floor_area_m2, smart_living_score, amenities, location
      FROM real_estate_data
      WHERE no = :property_id
    """)
    
    with engine.connect() as conn:
      target = conn.execute(target_query, {"property_id": property_id}).mappings().first()
      
      if not target:
        raise HTTPException(status_code=404, detail="Property not found")
      
      # Use similar properties logic (can be enhanced with recommender.py later)
      target_price = float(target["price"]) if target.get("price") else None
      target_type = target.get("property_type")
      target_lat = float(target["latitude"]) if target.get("latitude") else None
      target_lng = float(target["longitude"]) if target.get("longitude") else None
      target_score = float(target["smart_living_score"]) if target.get("smart_living_score") else None
      
      conditions = ["no != :property_id"]
      params = {"property_id": property_id, "limit": limit}
      
      if target_type:
        conditions.append("property_type = :property_type")
        params["property_type"] = target_type
      
      if target_price:
        conditions.append("price BETWEEN :min_price AND :max_price")
        params["min_price"] = target_price * 0.7
        params["max_price"] = target_price * 1.3
      
      if target_lat and target_lng:
        conditions.append("""
          (6371 * acos(
            cos(radians(:target_lat)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians(:target_lng)) +
            sin(radians(:target_lat)) * sin(radians(latitude))
          )) <= 10
        """)
        params["target_lat"] = target_lat
        params["target_lng"] = target_lng
      
      if target_score:
        conditions.append("smart_living_score >= :min_score")
        params["min_score"] = max(target_score - 10, 50)
      
      where_clause = " AND ".join(conditions)
      
      recommendations_query = text(f"""
        SELECT
          no,
          property_type,
          price,
          location,
          latitude,
          longitude,
          num_rooms,
          num_bathrooms,
          floor_area_m2,
          smart_living_score
        FROM real_estate_data
        WHERE {where_clause}
        ORDER BY 
          CASE WHEN property_type = :property_type THEN 0 ELSE 1 END,
          ABS(price - :target_price) ASC,
          smart_living_score DESC
        LIMIT :limit
      """)
      
      params["target_price"] = target_price or 0
      params["preferred_type"] = target_type or ""
      
      results = conn.execute(recommendations_query, params).mappings().all()
    
    recommendations: List[SearchProperty] = []
    for row in results:
      recommendations.append(
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
    
    return recommendations
    
  except HTTPException:
    raise
  except Exception as e:
    import logging
    logging.error(f"Error getting recommendations for property {property_id}: {e}", exc_info=True)
    return []


@app.get("/api/recommendations", response_model=List[SearchProperty], tags=["recommendations"])
async def get_recommendations(
  current_user: dict = Depends(get_current_user),
  limit: int = Query(default=10, ge=1, le=50, description="Number of recommendations")
) -> List[SearchProperty]:
  """Get personalized property recommendations based on user interactions."""
  try:
    engine = get_engine()
    user_id = current_user["id"]
    
    with engine.connect() as conn:
      # Get user's saved and viewed properties
      saved_query = text("""
        SELECT property_no FROM saved_properties WHERE user_id = :user_id
      """)
      saved_ids = [row["property_no"] for row in conn.execute(saved_query, {"user_id": user_id}).mappings().all()]
      
      viewed_query = text("""
        SELECT DISTINCT property_id FROM user_interactions 
        WHERE user_id = :user_id AND interaction_type = 'viewed'
      """)
      viewed_ids = [row["property_id"] for row in conn.execute(viewed_query, {"user_id": user_id}).mappings().all()]
      
      all_interacted_ids = list(set(saved_ids + viewed_ids))
      
      if not all_interacted_ids:
        # No interactions yet - return high-scored properties
        recommendations_query = text("""
          SELECT
            no,
            property_type,
            price,
            location,
            latitude,
            longitude,
            num_rooms,
            num_bathrooms,
            floor_area_m2,
            smart_living_score
          FROM real_estate_data
          WHERE smart_living_score >= 70
          ORDER BY smart_living_score DESC, price ASC
          LIMIT :limit
        """)
        results = conn.execute(recommendations_query, {"limit": limit}).mappings().all()
      else:
        # Find properties similar to user's interactions
        # Get average preferences from interacted properties
        preferences_query = text("""
          SELECT
            AVG(price) as avg_price,
            (SELECT property_type FROM real_estate_data WHERE no = ANY(:property_ids) GROUP BY property_type ORDER BY COUNT(*) DESC LIMIT 1) as preferred_type,
            AVG(num_rooms) as avg_rooms,
            AVG(num_bathrooms) as avg_baths,
            AVG(smart_living_score) as avg_score
          FROM real_estate_data
          WHERE no = ANY(:property_ids)
        """)
        prefs = conn.execute(preferences_query, {"property_ids": all_interacted_ids}).mappings().first()
        
        avg_price = float(prefs["avg_price"]) if prefs.get("avg_price") else None
        preferred_type = prefs.get("preferred_type")
        avg_score = float(prefs["avg_score"]) if prefs.get("avg_score") else 60
        
        # Build recommendation query
        conditions = ["no != ALL(:excluded_ids)"]
        params = {"excluded_ids": all_interacted_ids, "limit": limit}
        
        if preferred_type:
          conditions.append("property_type = :preferred_type")
          params["preferred_type"] = preferred_type
        
        if avg_price:
          conditions.append("price BETWEEN :min_price AND :max_price")
          params["min_price"] = avg_price * 0.7
          params["max_price"] = avg_price * 1.5
        
        conditions.append("smart_living_score >= :min_score")
        params["min_score"] = max(avg_score - 10, 50)
        
        where_clause = " AND ".join(conditions)
        
        recommendations_query = text(f"""
          SELECT
            no,
            property_type,
            price,
            location,
            latitude,
            longitude,
            num_rooms,
            num_bathrooms,
            floor_area_m2,
            smart_living_score
          FROM real_estate_data
          WHERE {where_clause}
          ORDER BY 
            CASE WHEN property_type = :preferred_type THEN 0 ELSE 1 END,
            smart_living_score DESC,
            ABS(price - :target_price) ASC
          LIMIT :limit
        """)
        params["target_price"] = avg_price or 0
        params["preferred_type"] = preferred_type or ""
        
        results = conn.execute(recommendations_query, params).mappings().all()
      
      recommendations: List[SearchProperty] = []
      for row in results:
        recommendations.append(
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
      
      return recommendations
      
  except Exception as e:
    import logging
    logging.error(f"Error getting recommendations: {e}", exc_info=True)
    return []

