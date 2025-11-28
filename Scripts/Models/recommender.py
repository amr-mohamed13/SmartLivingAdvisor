"""
Hybrid content-based recommender for SmartLivingAdvisor
"""

from pathlib import Path
import os
import logging
from typing import Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.pipeline import make_pipeline
from scipy.sparse import hstack, csr_matrix
from sqlalchemy import create_engine, text
import joblib
from dotenv import load_dotenv

# -------------------------
# Config / Paths
# -------------------------
load_dotenv()  # loads DATABASE_URL from .env if present

ARTIFACT_DIR = Path("Models")
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

VECTORIZER_PATH = ARTIFACT_DIR / "recommender_vectorizers.joblib"
NN_INDEX_PATH = ARTIFACT_DIR / "recommender_nn.joblib"
METADATA_PATH = ARTIFACT_DIR / "recommender_metadata.joblib"

# -------------------------
# Logging
# -------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("recommender")

# -------------------------
# Helpers
# -------------------------
def load_data_from_db(table_name: str = "real_estate_data", limit: Optional[int] = None) -> pd.DataFrame:
    """
    Load dataset from Neon DB using DATABASE_URL env var.
    If DATABASE_URL not present or connection fails, exception is raised.
    """
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL not set in environment. Use .env or call load_data(fallback_csv=...)")
    engine = create_engine(DATABASE_URL)
    log.info("Connecting to DB...")
    with engine.connect() as conn:
        sql = f"SELECT * FROM {table_name}"
        if limit:
            sql += f" LIMIT {int(limit)}"
        df = pd.read_sql(text(sql), conn)
    log.info(f"Loaded {len(df):,} rows from DB table '{table_name}'")
    return df


def sanitize_and_select(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ensure the expected columns exist and normalize column names.
    Uses the column names you provided earlier (no, property_type, floor_area, ...).
    Returns DataFrame with canonical columns present (adds NaNs if missing).
    """
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]
    # canonical names expected
    expected = [
        "no", "property_type", "floor_area", "property_condition", "amenities",
        "furnishing_status", "air_conditioning_text", "heating_text", "num_rooms",
        "num_bathrooms", "price", "latitude", "longitude", "location",
        "dist_hospital", "dist_school", "dist_bus", "crime_rate",
        "air_conditioning", "heating", "has_gym", "has_parking", "has_pool",
        "price_per_m2", "district_fips_id", "income", "population",
        "avg_delay", "avg_severity", "avg_duration", "price_to_income_ratio",
        "transport_score", "floor_area_m2", "hqs_score", "_hqs_pass_boolean",
        "transport_norm", "affordability_score", "smart_living_score", "smart_label"
    ]
    for col in expected:
        if col not in df.columns:
            df[col] = pd.NA
    # Enforce types for some columns
    df["no"] = pd.to_numeric(df["no"], errors="coerce").astype("Int64")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["num_rooms"] = pd.to_numeric(df["num_rooms"], errors="coerce").fillna(0).astype(int)
    df["num_bathrooms"] = pd.to_numeric(df["num_bathrooms"], errors="coerce").fillna(0).astype(int)
    # Ensure amenities is string
    df["amenities"] = df["amenities"].fillna("").astype(str)
    # Replace nan smart_living_score with 0 so comparisons safe
    df["smart_living_score"] = pd.to_numeric(df["smart_living_score"], errors="coerce").fillna(0.0)
    df["price_to_income_ratio"] = pd.to_numeric(df["price_to_income_ratio"], errors="coerce").fillna(np.nan)
    # Drop rows lacking price or coordinates or id
    df = df.dropna(subset=["no", "price", "latitude", "longitude"])
    return df

# -------------------------
# Feature engineering & vectorizers
# -------------------------
class Recommender:
    """
    Recommender object that contains vectorizers, scaler and nearest-neighbor index
    and exposes recommend_by_preferences and recommend_similar functions.
    """
    def __init__(self):
        # Encoders / vectorizers
        self.prop_type_enc: Optional[OneHotEncoder] = None
        self.amen_vectorizer: Optional[CountVectorizer] = None
        self.scaler: Optional[StandardScaler] = None
        self.nn: Optional[NearestNeighbors] = None

        # Metadata
        self.df: Optional[pd.DataFrame] = None
        self.feature_matrix: Optional[csr_matrix] = None
        self.index_to_id: Optional[np.ndarray] = None

    def fit(self, df: pd.DataFrame, n_neighbors: int = 20):
        """
        Fit encoders and create nearest neighbor index. df is sanitized already.
        """
        log.info("Fitting recommender...")
        self.df = df.reset_index(drop=True)

        # -------------------------
        # 1) property_type one-hot
        # -------------------------
        self.prop_type_enc = OneHotEncoder(handle_unknown="ignore", sparse=True)
        prop_type_col = self.df["property_type"].fillna("unknown").astype(str).values.reshape(-1, 1)
        prop_type_mat = self.prop_type_enc.fit_transform(prop_type_col)
        log.info(f"Property type one-hot shape: {prop_type_mat.shape}")

        # -------------------------
        # 2) amenities vector (bag-of-words)
        #    - prepare amenities text: join list-like strings into tokens
        # -------------------------
        # Normalize amenities field: remove brackets and split by comma if needed
        def normalize_amenities_text(x):
            if pd.isna(x):
                return ""
            s = str(x)
            # possible formats: "['Gym','Parking']" or "Gym, Parking"
            s = s.replace("[", " ").replace("]", " ").replace("'", " ").replace('"', " ")
            s = s.replace(",", " ")
            return " ".join(s.split()).lower()

        amen_texts = self.df["amenities"].apply(normalize_amenities_text).astype(str).tolist()
        self.amen_vectorizer = CountVectorizer(token_pattern=r"(?u)\b\w+\b", min_df=1)
        amen_mat = self.amen_vectorizer.fit_transform(amen_texts)
        log.info(f"Amenities vectorized shape: {amen_mat.shape}")

        # -------------------------
        # 3) numeric features (scaled)
        #    choose a compact set of numeric features that matter for similarity
        # -------------------------
        numeric_cols = [
            "floor_area_m2", "num_rooms", "num_bathrooms",
            "price_per_m2", "price_to_income_ratio", "smart_living_score", "transport_norm", "affordability_score"
        ]
        # ensure columns exist
        for c in numeric_cols:
            if c not in self.df.columns:
                self.df[c] = 0.0
        num_df = self.df[numeric_cols].fillna(0.0).astype(float)
        self.scaler = StandardScaler()
        num_mat = self.scaler.fit_transform(num_df)
        # convert to sparse
        num_mat = csr_matrix(num_mat)
        log.info(f"Numeric features shape: {num_mat.shape}")

        # -------------------------
        # 4) Combine feature matrices
        # -------------------------
        X = hstack([prop_type_mat, amen_mat, num_mat], format="csr")
        self.feature_matrix = X
        log.info(f"Combined feature matrix shape: {X.shape}")

        # -------------------------
        # 5) Fit NearestNeighbors using cosine distance
        # -------------------------
        self.nn = NearestNeighbors(n_neighbors=n_neighbors, metric="cosine", n_jobs=-1)
        self.nn.fit(X)
        log.info("NearestNeighbors fitted.")

        # index mapping
        self.index_to_id = self.df["no"].to_numpy()

        # Save artifacts
        joblib.dump({
            "prop_type_enc": self.prop_type_enc,
            "amen_vectorizer": self.amen_vectorizer,
            "scaler": self.scaler,
            "numeric_cols": numeric_cols
        }, VECTORIZER_PATH)
        joblib.dump(self.nn, NN_INDEX_PATH)
        joblib.dump({
            "index_to_id": self.index_to_id,
            "columns": list(self.df.columns)
        }, METADATA_PATH)
        log.info(f"Saved vectorizers and NN to {ARTIFACT_DIR}")

    def _build_query_vector(self, query: Dict) -> csr_matrix:
        """
        Build a feature vector for a user preference dict.
        query keys supported:
            - property_type (string)
            - amenities (list or comma string)
            - floor_area_m2, num_rooms, num_bathrooms, price_per_m2,
              price_to_income_ratio, smart_living_score, transport_norm, affordability_score
        """
        # load encoders (if not in memory)
        if self.prop_type_enc is None or self.amen_vectorizer is None or self.scaler is None:
            data = joblib.load(VECTORIZER_PATH)
            self.prop_type_enc = data["prop_type_enc"]
            self.amen_vectorizer = data["amen_vectorizer"]
            self.scaler = data["scaler"]
            # numeric_cols is in the joblib too
            numeric_cols = data.get("numeric_cols")
        else:
            numeric_cols = None  # will set below

        # property type
        ptype = str(query.get("property_type", "unknown") or "unknown")
        ptype_mat = self.prop_type_enc.transform([[ptype]])

        # amenities
        a = query.get("amenities", "")
        if isinstance(a, list):
            a = " ".join(a)
        a_text = str(a).replace("[", " ").replace("]", " ").replace("'", " ").lower()
        amen_mat = self.amen_vectorizer.transform([a_text])

        # numeric
        if numeric_cols is None:
            numeric_cols = joblib.load(VECTORIZER_PATH)["numeric_cols"]
        num_values = [float(query.get(c, 0.0) or 0.0) for c in numeric_cols]
        num_scaled = self.scaler.transform([num_values])
        num_mat = csr_matrix(num_scaled)

        q = hstack([ptype_mat, amen_mat, num_mat], format="csr")
        return q

    def recommend_by_preferences(self, preferences: Dict, top_n: int = 10,
                                 blend_weights: Tuple[float,float,float]=(0.6,0.25,0.15)) -> pd.DataFrame:
        """
        Main API: give user preferences, return top_n ranked properties (DataFrame).
        preferences: {
            'property_type': 'Apartment',
            'amenities': ['Gym','Parking'],
            'max_budget': 1500000,
            'min_rooms': 3,
            'location': 'Houston',
            'min_smart_score': 50,
            numeric fields optional...
        }

        blend_weights: (similarity_weight, smart_score_weight, affordability_weight)
        """
        if self.df is None:
            raise RuntimeError("Model not fitted or loaded. Call fit() or load_artifacts().")

        # Build query vector
        # Map preference keys to numeric_cols expected by vectorizer
        numeric_map = {
            "floor_area_m2": preferences.get("floor_area_m2"),
            "num_rooms": preferences.get("min_rooms") or preferences.get("num_rooms"),
            "num_bathrooms": preferences.get("num_bathrooms"),
            "price_per_m2": preferences.get("price_per_m2"),
            "price_to_income_ratio": preferences.get("price_to_income_ratio"),
            "smart_living_score": preferences.get("min_smart_score", 0.0),
            "transport_norm": preferences.get("transport_norm", 0.0),
            "affordability_score": preferences.get("affordability_score", 0.0)
        }
        qdict = {
            "property_type": preferences.get("property_type", "unknown"),
            "amenities": preferences.get("amenities", "")
        }
        # attach numeric
        qdict.update(numeric_map)

        qvec = self._build_query_vector(qdict)

        # nearest neighbors by cosine similarity
        distances, indices = self.nn.kneighbors(qvec, n_neighbors=min(len(self.df), 200))
        distances = distances.ravel()
        indices = indices.ravel()

        # convert cos distance -> similarity (1 - distance)
        similarities = 1.0 - distances

        # Candidate DataFrame
        candidates = self.df.iloc[indices].copy().reset_index(drop=True)
        candidates["_sim"] = similarities

        # Apply preference filters (budget, city, min rooms, etc.)
        if preferences.get("location"):
            candidates = candidates[candidates["location"].str.lower() == str(preferences["location"]).lower()]

        if preferences.get("max_budget") is not None:
            candidates = candidates[candidates["price"] <= float(preferences["max_budget"])]

        if preferences.get("min_rooms") is not None:
            candidates = candidates[candidates["num_rooms"] >= int(preferences["min_rooms"])]

        if preferences.get("min_smart_score") is not None:
            candidates = candidates[candidates["smart_living_score"] >= float(preferences["min_smart_score"])]

        if candidates.empty:
            log.info("No candidates after applying filters - returning empty DataFrame.")
            return candidates

        # Compute affordability score (normalized)
        # We'll invert price_to_income_ratio so lower ratio -> better
        pti = candidates["price_to_income_ratio"].fillna(candidates["price_to_income_ratio"].median())
        pti_med = float(pti.median()) if not pti.empty else 1.0
        affordability = np.clip((pti_med * 3.0 - pti) / (pti_med * 3.0), 0.0, 1.0)

        # Combine hybrid score: normalized similarity + normalized smart score + affordability
        sim_norm = (candidates["_sim"] - candidates["_sim"].min()) / (max(candidates["_sim"].max() - candidates["_sim"].min(), 1e-9))
        smart_norm = (candidates["smart_living_score"].fillna(0.0) - candidates["smart_living_score"].min()) / max((candidates["smart_living_score"].max() - candidates["smart_living_score"].min()), 1e-9)

        w_sim, w_smart, w_aff = blend_weights
        candidates["hybrid_score"] = (w_sim * sim_norm) + (w_smart * smart_norm) + (w_aff * affordability)

        # final ranking
        candidates = candidates.sort_values("hybrid_score", ascending=False).head(top_n)
        # present only relevant columns
        return candidates[[
            "no", "property_type", "price", "floor_area", "num_rooms", "num_bathrooms",
            "location", "smart_living_score", "price_to_income_ratio", "hybrid_score", "amenities"
        ]].reset_index(drop=True)

    def recommend_similar(self, property_no: int, top_n: int = 10, blend_weights: Tuple[float,float,float]=(0.6,0.25,0.15)) -> pd.DataFrame:
        """
        Recommend similar properties to a given property id (no).
        """
        if self.df is None:
            raise RuntimeError("Model not fitted or loaded.")
        mask = self.df["no"] == property_no
        if not mask.any():
            raise ValueError(f"Property id {property_no} not found.")
        idx = int(self.df[mask].index[0])
        qvec = self.feature_matrix[idx]
        distances, indices = self.nn.kneighbors(qvec, n_neighbors=min(len(self.df), top_n+1))
        distances = distances.ravel()
        indices = indices.ravel()
        # exclude itself
        filtered = [(i, d) for i,d in zip(indices, distances) if i != idx][:top_n]
        if not filtered:
            return pd.DataFrame()
        inds = [i for i,_ in filtered]
        sims = [1 - d for _, d in filtered]
        candidates = self.df.iloc[inds].copy().reset_index(drop=True)
        candidates["_sim"] = sims

        # compute hybrid similar to above
        pti = candidates["price_to_income_ratio"].fillna(candidates["price_to_income_ratio"].median())
        pti_med = float(pti.median()) if not pti.empty else 1.0
        affordability = np.clip((pti_med * 3.0 - pti) / (pti_med * 3.0), 0.0, 1.0)
        sim_norm = (candidates["_sim"] - candidates["_sim"].min()) / max((candidates["_sim"].max() - candidates["_sim"].min()), 1e-9)
        smart_norm = (candidates["smart_living_score"].fillna(0.0) - candidates["smart_living_score"].min()) / max((candidates["smart_living_score"].max() - candidates["smart_living_score"].min()), 1e-9)
        w_sim, w_smart, w_aff = blend_weights
        candidates["hybrid_score"] = (w_sim * sim_norm) + (w_smart * smart_norm) + (w_aff * affordability)

        return candidates[[
            "no", "property_type", "price", "floor_area", "num_rooms", "num_bathrooms",
            "location", "smart_living_score", "price_to_income_ratio", "hybrid_score", "amenities"
        ]].sort_values("hybrid_score", ascending=False).reset_index(drop=True)

    def load_artifacts(self):
        """
        Load vectorizers, NN index, metadata from ARTIFACT_DIR.
        """
        d = joblib.load(VECTORIZER_PATH)
        self.prop_type_enc = d["prop_type_enc"]
        self.amen_vectorizer = d["amen_vectorizer"]
        self.scaler = d["scaler"]
        meta = joblib.load(METADATA_PATH)
        self.index_to_id = meta["index_to_id"]
        self.nn = joblib.load(NN_INDEX_PATH)
        log.info("Artifacts loaded from disk (vectorizers + NN).")

    def load_data_into_memory(self, df: pd.DataFrame):
        """
        Load a DataFrame into the recommender object (used when artifacts already exist).
        """
        self.df = df.reset_index(drop=True)
        # rebuild feature_matrix using already saved vectorizers
        prop_type_mat = self.prop_type_enc.transform(self.df["property_type"].fillna("unknown").astype(str).values.reshape(-1,1))
        amen_texts = self.df["amenities"].fillna("").astype(str).apply(lambda s: s.replace("[", " ").replace("]", " ").replace("'", " ").lower()).tolist()
        amen_mat = self.amen_vectorizer.transform(amen_texts)
        numeric_cols = joblib.load(VECTORIZER_PATH)["numeric_cols"]
        num_df = self.df[numeric_cols].fillna(0.0).astype(float)
        num_mat = csr_matrix(self.scaler.transform(num_df))
        self.feature_matrix = hstack([prop_type_mat, amen_mat, num_mat], format="csr")
        log.info("Feature matrix rebuilt in memory.")

# -------------------------
# Convenience: build and demo
# -------------------------
def build_recommender(use_db: bool = False, db_table: str = "real_estate_data", sample_n: Optional[int] = None) -> Recommender:
    """
    Build recommender from database (if use_db) or local CSV (fallback).
    """
    if use_db:
        try:
            df = load_data_from_db(table_name=db_table, limit=sample_n)
        except Exception as e:
            log.warning(f"DB load failed: {e}. Falling back to local CSV.")
            df = load_data_local(LOCAL_CSV, nrows=sample_n)
    else:
        df = load_data_local(LOCAL_CSV, nrows=sample_n)

    df = sanitize_and_select(df)
    rec = Recommender()
    rec.fit(df)
    return rec

# -------------------------
# Demo / CLI
# -------------------------
if __name__ == "__main__":
    # Quick demo: build model from local CSV, then run a sample recommendation
    log.info("Starting recommender build (demo).")
    # You can set use_db=True if DATABASE_URL is set and table exists
    rec = build_recommender(use_db=False, sample_n=None)  # set use_db=True to load from Neon

    # Example preference dictionary
    pref = {
        "property_type": "Apartment",
        "amenities": ["gym", "parking"],
        "max_budget": 2_000_000,
        "min_rooms": 3,
        "location": "Houston",
        "min_smart_score": 50
    }
    top = rec.recommend_by_preferences(pref, top_n=10)
    log.info("Top recommendations (demo):")
    log.info(top.to_string(index=False))

    # Example: recommend similar to property no=1
    try:
        similar = rec.recommend_similar(property_no=1, top_n=10)
        log.info("Similar properties to id=1:")
        log.info(similar.to_string(index=False))
    except Exception as e:
        log.warning(f"Could not recommend similar: {e}")

    log.info("Demo finished.")
