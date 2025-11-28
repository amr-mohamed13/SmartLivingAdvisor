from sqlalchemy import (
    Column, Integer, Float, String, Boolean, BigInteger
)
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class RealEstateData(Base):
    __tablename__ = "real_estate_data"
    __table_args__ = {"schema": "public"}

    no = Column(Integer, primary_key=True)

    property_type = Column(String(50))
    floor_area = Column(Float)
    property_condition = Column(String(50))
    amenities = Column(String)                 # stringified list
    furnishing_status = Column(String(50))

    air_conditioning_text = Column(String(10))
    heating_text = Column(String(10))

    num_rooms = Column(Integer)
    num_bathrooms = Column(Integer)
    price = Column(BigInteger)

    latitude = Column(Float)
    longitude = Column(Float)

    location = Column(String(100))

    dist_hospital = Column(Float)
    dist_school = Column(Float)
    dist_bus = Column(Float)

    crime_rate = Column(Float)

    air_conditioning = Column(Boolean)
    heating = Column(Boolean)

    has_gym = Column(Boolean)
    has_parking = Column(Boolean)
    has_pool = Column(Boolean)

    price_per_m2 = Column(Float)

    district_fips_id = Column(BigInteger)
    income = Column(Integer)
    population = Column(Integer)

    avg_delay = Column(Float)
    avg_severity = Column(Float)
    avg_duration = Column(Float)

    price_to_income_ratio = Column(Float)
    transport_score = Column(Float)

    floor_area_m2 = Column(Float)
    hqs_score = Column(Float)
    _hqs_pass_boolean = Column(Boolean)

    transport_norm = Column(Float)
    affordability_score = Column(Float)
    smart_living_score = Column(Float)

    smart_label = Column(String(20))
