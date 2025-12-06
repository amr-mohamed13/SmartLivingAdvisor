"""
SmartLivingAdvisor — HQS & Smart Living Score Processor
-------------------------------------------------------
This script:
- Loads your real_estate dataset (exact column names)
- Computes strict but realistic HQS score (0–100)
- Computes Smart Living Score (0–100)
- Assigns Smart Rating label
- Keeps ALL original dataset columns + adds:
      - floor_area_m2
      - amenities_parsed
      - air_conditioning_flag
      - heating_flag
      - hqs_score
      - hqs_pass
      - transport_norm
      - affordability_score
      - extras_score
      - smart_living_score
      - smart_label
- Saves cleaned dataset (no top outputs unless you want)

Clean, stable, professional.
"""

import pandas as pd
import numpy as np
import ast
import logging
from pathlib import Path

# --------------------------
# Configuration
# --------------------------

INPUT_FILE  = Path("/mnt/data/cleaned_final_dataset.csv")  # YOU PROVIDED THIS FILE
OUTPUT_FILE = Path(r"D:\DEPI_Project\Datasets\Dataset\real_estate_dataset.cleaned.csv")

RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [INFO] %(message)s")
log = logging.getLogger("SLS")

# --------------------------
# Helper Functions
# --------------------------

def safe_parse_list(cell):
    """Converts amenities text → list."""
    if pd.isna(cell):
        return []
    if isinstance(cell, list):
        return cell
    try:
        val = ast.literal_eval(cell)
        if isinstance(val, (list, tuple)):
            return list(val)
    except:
        pass
    if isinstance(cell, str):
        return [x.strip().strip("'\"") for x in cell.split(",") if x.strip()]
    return []

def parse_bool(x):
    if isinstance(x, bool):
        return x
    s = str(x).lower().strip()
    if s in ("yes", "true", "1", "y", "t"): return True
    if s in ("no", "false", "0", "n", "f"): return False
    return False

def detect_area_in_m2(series):
    """Detects whether area is in sqft or m² automatically."""
    ser = pd.to_numeric(series, errors="coerce")
    med = ser.median()
    if med > 1000:
        log.info("floor_area looks like sqft → converting to m²")
        return ser / 10.7639
    else:
        log.info("floor_area already in m²")
        return ser

def normalize_0_100(col):
    vals = col.values
    low, high = np.nanpercentile(vals, 1), np.nanpercentile(vals, 99)
    return np.clip((vals - low) / (high - low) * 100, 0, 100)

# --------------------------
# HQS Scoring Functions
# --------------------------

def score_size(area_m2):
    """Large area = higher score."""
    return np.clip((area_m2 / 120) * 100, 0, 100)

def score_rooms_baths(r, b):
    r_score = np.clip((r / 3) * 100, 0, 100)
    b_score = np.clip((b / 2) * 100, 0, 100)
    return (r_score + b_score) / 2

def score_condition(cond):
    cond = cond.str.lower().fillna("")
    return cond.map({
        "new": 100,
        "renovated": 85,
        "old": 40
    }).fillna(60).values

def score_climate(ac, heat):
    ac = ac.astype(bool)
    heat = heat.astype(bool)
    return np.where(ac & heat, 100,
                    np.where(ac | heat, 80, 0))

def score_amenities(am_list):
    scores = []
    for items in am_list:
        items = [x.lower() for x in items]
        score = 0
        if any("gym" in x for x in items): score += 30
        if any("park" in x for x in items): score += 30
        if any("pool" in x for x in items): score += 40
        scores.append(min(score, 100))
    return np.array(scores)

def score_crime(crime):
    return np.clip(100 - (crime / 10 * 100), 0, 100)


# --------------------------
# Smart Living Score
# --------------------------

def compute_smart_score(df):
    w_hqs = 0.50
    w_trans = 0.20
    w_aff = 0.20
    w_extra = 0.10

    return (
        df["hqs_score"] * w_hqs +
        df["transport_norm"] * w_trans +
        df["affordability_score"] * w_aff +
        df["extras_score"] * w_extra
    )

# --------------------------
# Main
# --------------------------

def run():
    log.info(f"Loading dataset: {INPUT_FILE}")
    df = pd.read_csv(INPUT_FILE)

    log.info(f"Rows: {len(df):,} | Columns: {df.columns.tolist()}")

    # Ensure correct column names exist:
    required = {
        "id","property_type","floor_area","property_condition","amenities",
        "furnishing_status","air_conditioning_text","heating_text",
        "num_rooms","num_bathrooms","price","latitude","longitude","location",
        "dist_hospital","dist_school","dist_bus","crime_rate",
        "air_conditioning","heating","has_gym","has_parking","has_pool",
        "price_per_m2","district_fips_id","income","population",
        "avg_delay","avg_severity","avg_duration","price_to_income_ratio",
        "transport_score"
    }

    missing = required - set(df.columns)
    if missing:
        log.error(f"Dataset missing columns: {missing}")
        raise SystemExit(1)

    # Parse amenities
    df["amenities_parsed"] = df["amenities"].apply(safe_parse_list)

    # AC/Heating flags
    df["air_conditioning_flag"] = df["air_conditioning"].apply(parse_bool)
    df["heating_flag"] = df["heating"].apply(parse_bool)

    # Floor area to m²
    df["floor_area_m2"] = detect_area_in_m2(df["floor_area"])

    # HQS calculation
    log.info("Calculating HQS Scores...")

    df["hqs_size"] = score_size(df["floor_area_m2"])
    df["hqs_rooms_baths"] = score_rooms_baths(df["num_rooms"], df["num_bathrooms"])
    df["hqs_condition"] = score_condition(df["property_condition"])
    df["hqs_climate"] = score_climate(df["air_conditioning_flag"], df["heating_flag"])
    df["hqs_amenities"] = score_amenities(df["amenities_parsed"])
    df["hqs_crime"] = score_crime(df["crime_rate"])

    df["hqs_score"] = np.round(
        df["hqs_size"] * 0.30 +
        df["hqs_rooms_baths"] * 0.20 +
        df["hqs_condition"] * 0.15 +
        df["hqs_climate"] * 0.10 +
        df["hqs_amenities"] * 0.15 +
        df["hqs_crime"] * 0.10,
    2)

    df["hqs_pass"] = df["hqs_score"] >= 60

    # Smart Score
    df["transport_norm"] = normalize_0_100(df["transport_score"])
    df["affordability_score"] = normalize_0_100(-df["price_to_income_ratio"])

    # Extras
    df["extras_score"] = (
        df["hqs_amenities"] * 0.7 +
        df["has_gym"].astype(int) * 5 +
        df["has_parking"].astype(int) * 5 +
        df["has_pool"].astype(int) * 10
    ).clip(0, 100)

    df["smart_living_score"] = np.round(compute_smart_score(df), 2)

    # Labels
    def label(x):
        if x >= 80: return "Excellent"
        if x >= 65: return "Good"
        if x >= 45: return "Fair"
        return "Poor"

    df["smart_label"] = df["smart_living_score"].apply(label)

    # Save
    log.info(f"Saving cleaned dataset to: {OUTPUT_FILE}")
    df.to_csv(OUTPUT_FILE, index=False)

    log.info("Done.")
    return df

if __name__ == "__main__":
    run()
