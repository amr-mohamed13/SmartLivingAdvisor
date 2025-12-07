# 🏠 SmartLivingAdvisor

<div align="center">

**AI-Powered Real Estate Discovery Platform**

*Making intelligent property decisions through data-driven insights*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Dataset Description](#-dataset-description)
- [Smart Living Score Formula](#-smart-living-score-formula)
- [Recommender System](#-recommender-system)
- [Backend API Endpoints](#-backend-api-endpoints)
- [Database Schema](#-database-schema)
- [Installation & Setup](#-installation--setup)
- [Screenshots](#-screenshots)
- [Future Work](#-future-work)

---

## 🎯 Project Overview

**SmartLivingAdvisor** is an enterprise-grade, full-stack AI platform that revolutionizes real estate discovery by combining machine learning, geospatial intelligence, and user-centric design. The platform empowers users to make informed property decisions through comprehensive data analysis and personalized recommendations.

### Core Concepts

#### 🤖 AI-Powered Real Estate Discovery
Our platform leverages advanced machine learning algorithms to analyze thousands of property attributes, neighborhood characteristics, and user preferences to deliver intelligent property recommendations tailored to each user's unique lifestyle and requirements.

#### ⭐ Smart Living Score
A proprietary 0-100 scoring system that evaluates properties across multiple dimensions:
- **HQS Quality Evaluation** (50% weight)
- **Transportation Accessibility** (20% weight)
- **Affordability Metrics** (20% weight)
- **Premium Amenities** (10% weight)

This score provides users with an instant, comprehensive assessment of a property's overall livability and value proposition.

#### 🎯 Ranking Engine
Our sophisticated ranking engine processes multiple factors simultaneously:
- Property features and amenities
- Neighborhood safety and demographics
- Proximity to essential services
- Market affordability indicators
- User interaction history

#### 🗺️ Urban Insights
Comprehensive neighborhood analysis including:
- Crime rate statistics
- Population demographics
- Average household income
- Transportation infrastructure
- Proximity to schools, hospitals, and amenities

#### 🗺️ Google Maps Integration
Seamless integration with Google Maps Platform for:
- Interactive property location visualization
- Points of Interest (POI) discovery
- Real-time travel time calculations (walking, driving, transit)
- Dynamic map rendering with custom markers

#### 🎁 Personalized Recommendations
Content-based recommendation system that learns from:
- User saved properties
- Viewing history
- Explicit preferences
- Implicit behavioral patterns

---

## ✨ Features

### 🧠 Smart Living Score Model
- **Multi-dimensional scoring** across 4 key categories
- **Real-time calculation** for all properties
- **Normalized scoring** (0-100 scale) for easy comparison
- **Label classification**: Excellent (80+), Good (65-79), Fair (45-64), Poor (<45)

### 🏆 HQS Quality Evaluation
Comprehensive Housing Quality Standards assessment:
- **Size scoring** (30%): Based on floor area in m²
- **Room configuration** (20%): Bedrooms and bathrooms analysis
- **Property condition** (15%): New, Renovated, or Old classification
- **Climate control** (10%): Air conditioning and heating availability
- **Amenities** (15%): Gym, pool, parking facilities
- **Safety** (10%): Crime rate normalization

### 🔍 Content-Based Recommender
Advanced machine learning recommender system:
- **Feature engineering**: Property type, amenities, numeric features
- **Vectorization**: One-hot encoding + bag-of-words + standardized numeric features
- **Nearest Neighbors**: Cosine similarity-based property matching
- **Hybrid scoring**: Combines similarity, Smart Score, and affordability

### 👤 User Preference Tracking
Comprehensive user behavior analytics:
- **Saved properties** tracking
- **View history** logging
- **Interaction patterns** analysis
- **Preference inference** from behavior

### 🗺️ Google Maps POIs
Rich Points of Interest exploration:
- **12+ POI categories**: Restaurants, Cafes, Pharmacies, Schools, Hospitals, Supermarkets, Gyms, Parks, ATMs, Gas Stations, Banks, Shopping Malls
- **Distance calculations** from property location
- **Travel time estimates**: Walking, driving, and public transport
- **Rating and opening status** display
- **Interactive map visualization** with custom markers

### 🔐 Auth System with Social Logins
Enterprise-grade authentication:
- **Email/password** authentication
- **OAuth 2.0** integration (Google, Facebook, Apple)
- **JWT token** management
- **Refresh token** support
- **Secure session** handling

### 🏡 Property Details + Dynamic Maps
Comprehensive property information display:
- **Image gallery** with modal viewer
- **Full property details** (all database fields)
- **Interactive Google Maps** with custom house markers
- **POI Explorer** with category filtering
- **Travel time** calculations
- **Save property** functionality

### 🔎 Advanced Filters
Powerful search and filtering capabilities:
- **Location-based** search
- **Price range** filtering
- **Property type** selection
- **Bedroom/bathroom** requirements
- **Amenities** filtering (gym, parking, pool)
- **Smart Living Score** range
- **Distance to services** (hospital, school, bus)
- **Crime rate** thresholds
- **Income and population** filters

### 💾 Saved Homes
User property management:
- **Save/unsave** properties
- **View saved** properties list
- **Sync across devices**
- **Personalized recommendations** based on saved properties

### 🎨 High-Quality UI (Zillow-Inspired)
Professional, modern user interface:
- **Clean, minimalist design**
- **Responsive layout** (mobile, tablet, desktop)
- **Smooth animations** and transitions
- **Intuitive navigation**
- **Accessible** design patterns
- **Premium visual** hierarchy

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Frontend                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Components │  │   Hooks      │  │   Contexts   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                      │
│                    ┌───────▼────────┐                             │
│                    │  React Router  │                             │
│                    └───────┬────────┘                             │
└────────────────────────────┼──────────────────────────────────────┘
                             │ HTTP/REST
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                      FastAPI Backend                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth       │  │   Properties │  │   POIs       │           │
│  │   Router     │  │   Router     │  │   Router     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                  │                  │                    │
│         └──────────────────┼──────────────────┘                    │
│                            │                                      │
│                    ┌───────▼────────┐                             │
│                    │  SQLAlchemy    │                             │
│                    │     ORM        │                             │
│                    └───────┬────────┘                             │
└────────────────────────────┼──────────────────────────────────────┘
                             │ SQL
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│              PostgreSQL Database (Neon)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   users      │  │   real_estate│  │   saved_     │           │
│  │              │  │   _data      │  │   properties │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   user_      │  │   user_      │  │   refresh_   │           │
│  │   preferences│  │   interactions│  │   tokens     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
                             │
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    ML Engine (Python)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Recommender │  │  Score        │  │  Feature     │          │
│  │  Model       │  │  Calculator  │  │  Engineering │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                      │
│                    ┌───────▼────────┐                             │
│                    │   Joblib       │                             │
│                    │   Artifacts    │                             │
│                    └────────────────┘                             │
└───────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19.2 | UI framework |
| | React Router 7.9 | Client-side routing |
| | Vite | Build tool & dev server |
| **Backend** | FastAPI | REST API framework |
| | SQLAlchemy | ORM & database abstraction |
| | Pydantic | Data validation |
| | JWT | Authentication tokens |
| **Database** | PostgreSQL (Neon) | Primary data store |
| **ML Engine** | Python 3.x | Machine learning |
| | scikit-learn | ML algorithms |
| | pandas | Data processing |
| | joblib | Model serialization |
| **External APIs** | Google Maps Platform | Maps & Places API |
| | OAuth 2.0 Providers | Social authentication |

---

## 📊 Dataset Description

Our comprehensive real estate dataset contains **67+ columns** covering every aspect of property evaluation:

### 🏠 House Features

| Column | Type | Description |
|--------|------|-------------|
| `no` | Integer | Unique property identifier (Primary Key) |
| `property_type` | String | Type of property (Apartment, Villa, Condo, etc.) |
| `floor_area` | Float | Floor area (original unit) |
| `floor_area_m2` | Float | Floor area in square meters |
| `property_condition` | String | Condition: New, Renovated, Old |
| `num_rooms` | Integer | Number of bedrooms |
| `num_bathrooms` | Integer | Number of bathrooms |
| `furnishing_status` | String | Furnishing status |
| `price` | BigInteger | Property price |
| `price_per_m2` | Float | Price per square meter |

### 🎯 Amenities & Features

| Column | Type | Description |
|--------|------|-------------|
| `amenities` | String | List of amenities (stringified) |
| `air_conditioning` | Boolean | Has air conditioning |
| `heating` | Boolean | Has heating |
| `has_gym` | Boolean | Has gym facility |
| `has_parking` | Boolean | Has parking |
| `has_pool` | Boolean | Has swimming pool |

### 📍 Geography & Location

| Column | Type | Description |
|--------|------|-------------|
| `latitude` | Float | Geographic latitude |
| `longitude` | Float | Geographic longitude |
| `location` | String | Address/location string |
| `district_fips_id` | BigInteger | Census tract FIPS code |

### 🏥 Proximity Metrics

| Column | Type | Description |
|--------|------|-------------|
| `dist_hospital` | Float | Distance to nearest hospital (km) |
| `dist_school` | Float | Distance to nearest school (km) |
| `dist_bus` | Float | Distance to nearest bus stop (km) |

### 🚨 Crime & Safety

| Column | Type | Description |
|--------|------|-------------|
| `crime_rate` | Float | Local crime rate metric |
| `avg_delay` | Float | Average incident delay |
| `avg_severity` | Float | Average incident severity |
| `avg_duration` | Float | Average incident duration |

### 💰 Economic Indicators

| Column | Type | Description |
|--------|------|-------------|
| `income` | Integer | Average household income in area |
| `population` | Integer | Area population |
| `price_to_income_ratio` | Float | Affordability ratio |
| `transport_score` | Float | Transportation accessibility score |

### ⭐ Score Fields

| Column | Type | Description |
|--------|------|-------------|
| `hqs_score` | Float | Housing Quality Standards score (0-100) |
| `_hqs_pass_boolean` | Boolean | HQS pass/fail (≥60) |
| `transport_norm` | Float | Normalized transport score (0-100) |
| `affordability_score` | Float | Affordability score (0-100) |
| `extras_score` | Float | Premium amenities score (0-100) |
| `smart_living_score` | Float | **Smart Living Score (0-100)** |
| `smart_label` | String | Score label: Excellent/Good/Fair/Poor |

---

## 🧮 Smart Living Score Formula

The **Smart Living Score** is a weighted composite metric that evaluates properties across four critical dimensions:

### Formula

```
Smart Living Score = (HQS × 0.50) + (Transport × 0.20) + (Affordability × 0.20) + (Extras × 0.10)
```

### Component Breakdown

#### 1. HQS Score (50% Weight)
**Housing Quality Standards** - Comprehensive property quality assessment:

```
HQS = (Size × 0.30) + (Rooms/Baths × 0.20) + (Condition × 0.15) + 
      (Climate × 0.10) + (Amenities × 0.15) + (Crime × 0.10)
```

**Sub-components:**
- **Size Score**: `min((floor_area_m2 / 120) × 100, 100)`
- **Rooms/Baths Score**: Average of bedroom and bathroom scores
- **Condition Score**: New=100, Renovated=85, Old=40
- **Climate Score**: AC+Heating=100, One=80, None=0
- **Amenities Score**: Gym=30, Park=30, Pool=40 (max 100)
- **Crime Score**: `max(100 - (crime_rate / 10 × 100), 0)`

#### 2. Transport Score (20% Weight)
**Normalized Transportation Accessibility** (0-100):
- Based on `transport_score` field
- Normalized using 1st-99th percentile range
- Higher score = better transportation access

#### 3. Affordability Score (20% Weight)
**Price-to-Income Ratio Normalization** (0-100):
- Inverted `price_to_income_ratio` (lower ratio = better)
- Normalized using 1st-99th percentile range
- Higher score = more affordable

#### 4. Extras Score (10% Weight)
**Premium Amenities Bonus**:
```
Extras = (HQS_Amenities × 0.7) + (Gym × 5) + (Parking × 5) + (Pool × 10)
```
- Capped at 100 points
- Rewards premium lifestyle features

### Why It Matters

The Smart Living Score provides:
- ✅ **Instant property comparison** across all dimensions
- ✅ **Objective quality assessment** independent of price
- ✅ **Lifestyle fit indicator** for different user needs
- ✅ **Market positioning** understanding
- ✅ **Investment decision support** through comprehensive analysis

### Score Interpretation

| Score Range | Label | Meaning |
|-------------|-------|---------|
| **80-100** | Excellent | Premium property with outstanding features |
| **65-79** | Good | High-quality property with strong attributes |
| **45-64** | Fair | Average property with acceptable features |
| **0-44** | Poor | Property may have significant limitations |

---

## 🔍 Recommender System

Our hybrid content-based recommendation engine uses advanced machine learning to match users with properties that align with their preferences and behavior.

### Feature Engineering

#### 1. Property Type Encoding
- **One-Hot Encoding** for categorical property types
- Handles unknown types gracefully
- Sparse matrix representation for efficiency

#### 2. Amenities Vectorization
- **Bag-of-Words** model for amenities text
- Tokenizes amenity lists (e.g., `['Gym', 'Parking', 'Pool']`)
- Normalizes text (lowercase, removes brackets/quotes)
- Creates feature vectors for similarity matching

#### 3. Numeric Feature Scaling
Standardized numeric features:
- `floor_area_m2`
- `num_rooms`
- `num_bathrooms`
- `price_per_m2`
- `price_to_income_ratio`
- `smart_living_score`
- `transport_norm`
- `affordability_score`

**StandardScaler** normalizes all features to mean=0, std=1.

### User Preference Model

The system tracks and learns from:

#### Explicit Preferences
- Property type preferences
- Budget constraints
- Room requirements
- Amenity preferences (gym, pool, parking)
- Location preferences

#### Implicit Preferences
- Saved properties patterns
- Viewing history
- Interaction frequency
- Time spent on property pages

### Content-Based Similarities

#### Feature Matrix Construction
```
Feature Vector = [Property Type OHE | Amenities BoW | Scaled Numeric Features]
```

#### Similarity Calculation
- **Cosine Similarity** using Nearest Neighbors algorithm
- **k=20** nearest neighbors for each property
- **Sparse matrix** operations for efficiency
- **Index mapping** for fast property lookup

### Hybrid Scoring

Final recommendation score combines three factors:

```
Hybrid Score = (Similarity × 0.60) + (Smart Score × 0.25) + (Affordability × 0.15)
```

#### Components:
1. **Similarity Weight (60%)**: Content-based matching strength
2. **Smart Score Weight (25%)**: Overall property quality
3. **Affordability Weight (15%)**: Price-to-income ratio normalization

### Recommendation Workflow

```
User Interaction → Preference Extraction → Feature Vectorization → 
Nearest Neighbors Search → Hybrid Scoring → Top-N Ranking → Results
```

### Model Persistence

- **Vectorizers**: Saved as `recommender_vectorizers.joblib`
- **NN Index**: Saved as `recommender_nn.joblib`
- **Metadata**: Property ID mappings saved as `recommender_metadata.joblib`

---

## 🔌 Backend API Endpoints

### System Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/health` | GET | Health check endpoint | ❌ |

### Listings & Search

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/listings` | GET | Get featured property listings | ❌ |
| `/search` | GET | Advanced property search with filters | ❌ |
| `/property/{property_id}` | GET | Get single property details | ❌ |
| `/api/properties/{id}` | GET | Alternative property endpoint | ❌ |
| `/api/properties/similar` | GET | Find similar properties | ❌ |

**Query Parameters for `/search`:**
- `query`: Search text (location, city, neighborhood)
- `property_type`: Filter by property type
- `min_price`, `max_price`: Price range
- `min_beds`, `min_baths`: Room requirements
- `has_gym`, `has_parking`, `has_pool`: Amenity filters
- `min_score`, `max_score`: Smart Living Score range
- `min_dist_hospital`, `max_dist_hospital`: Hospital proximity
- `min_dist_school`, `max_dist_school`: School proximity
- `min_dist_bus`, `max_dist_bus`: Transit proximity
- `min_crime_rate`, `max_crime_rate`: Safety filters
- `min_income`, `max_income`: Income range
- `sort_by`: `score`, `price_asc`, `price_desc`
- `limit`: Results limit (1-100)

### Recommendations

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/recommendations/{property_id}` | GET | Get recommendations for a property | ❌ |
| `/api/recommendations` | GET | Get personalized recommendations | ✅ |

**Query Parameters:**
- `limit`: Number of recommendations (default: 6-10)

### Places & POIs

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/places/nearby` | GET | Get nearby Points of Interest | ❌ |

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Search radius in meters (100-5000, default: 2500)
- `types`: POI type (restaurant, cafe, pharmacy, school, hospital, etc.)

### Authentication

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/register` | POST | Register new user | ❌ |
| `/auth/login` | POST | User login | ❌ |
| `/auth/oauth/{provider}` | GET | OAuth login (google/facebook/apple) | ❌ |
| `/auth/refresh` | POST | Refresh access token | ❌ |
| `/auth/logout` | POST | Logout user | ✅ |

### User Management

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/user/profile` | GET | Get user profile | ✅ |
| `/user/preferences` | GET/PUT | Get/update user preferences | ✅ |
| `/user/saved` | GET | Get saved properties | ✅ |
| `/user/save-property` | POST | Save a property | ✅ |
| `/user/save-property/{id}` | DELETE | Unsave a property | ✅ |
| `/user/view-property` | POST | Log property view | ✅ |

---

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `email` (unique index)

### User Preferences Table

```sql
CREATE TABLE user_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    preferred_city VARCHAR(100),
    max_budget FLOAT,
    min_rooms INTEGER,
    prefers_gym BOOLEAN,
    prefers_pool BOOLEAN,
    prefers_parking BOOLEAN
);
```

### User Interactions Table

```sql
CREATE TABLE user_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    property_id INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `user_id`
- `(user_id, interaction_type)`

**Interaction Types:**
- `saved`
- `viewed`
- `contacted_agent`

### Saved Properties Table

```sql
CREATE TABLE saved_properties (
    user_id INTEGER REFERENCES users(id),
    property_no INTEGER,
    saved_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, property_no)
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);
```

**Indexes:**
- `user_id`
- `token` (unique index)

### Real Estate Data Table

The main property data table contains **67+ columns** as described in the [Dataset Description](#-dataset-description) section.

**Key Columns:**
- `no` (Primary Key)
- `property_type`, `price`, `location`
- `latitude`, `longitude`
- `num_rooms`, `num_bathrooms`
- `smart_living_score`, `hqs_score`
- All feature columns for ML

**Indexes:**
- `no` (primary key)
- `smart_living_score` (for ranking)
- `location` (for search)
- `(latitude, longitude)` (for geospatial queries)

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **PostgreSQL** database (or Neon account)
- **Google Maps API Key** (for maps and POIs)
- **OAuth Credentials** (Google, Facebook, Apple - optional)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SmartLivingAdvisor.git
cd SmartLivingAdvisor
```

### 2. Frontend Setup

```bash
cd website/frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

**Edit `.env`:**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Run development server:**
```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`

### 3. Backend Setup

```bash
cd website/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Edit `.env`:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# OAuth Credentials (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret

# CORS
CORS_ALLOW_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Run FastAPI server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### 4. Database Setup

#### Option A: Using Neon (Recommended)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL` in backend `.env`

#### Option B: Local PostgreSQL

```bash
# Create database
createdb smartlivingadvisor

# Run migrations (if using Alembic)
alembic upgrade head
```

#### Upload Dataset

```bash
cd Scripts/Database
python -m upload_to_db
```

This will:
- Load the CSV dataset
- Clean column names (PostgreSQL-safe)
- Upload to `real_estate_data` table

### 5. ML Model Training (Optional)

Train the recommender model:

```bash
cd Scripts/Models
python recommender.py
```

This will:
- Load data from database
- Fit vectorizers and Nearest Neighbors model
- Save artifacts to `Models/` directory

### 6. Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Frontend:**
   - Open `http://localhost:5173`
   - Should see home page

3. **API Docs:**
   - Open `http://localhost:8000/docs`
   - Test endpoints interactively

---

## 📸 Screenshots

### Home Page
![Home Page](docs/screenshots/home-page.png)
*Landing page with hero section, featured listings, and service highlights*

### Property Details Page
![Property Details](docs/screenshots/property-details.png)
*Comprehensive property information with image gallery, maps, and POI explorer*

### Recommendations
![Recommendations](docs/screenshots/recommendations.png)
*Personalized property recommendations based on user preferences*

### Interactive Maps
![Maps](docs/screenshots/maps.png)
*Google Maps integration showing property location and nearby POIs*

### Login / Register
![Auth](docs/screenshots/auth.png)
*Authentication page with social login options*

### Admin Tools
![Admin](docs/screenshots/admin.png)
*Admin dashboard for property and user management*

---

## 🔮 Future Work

### Phase 1: Enhanced ML Capabilities
- [ ] **Deep Learning Integration**: Implement neural networks for more sophisticated property embeddings
- [ ] **Collaborative Filtering**: Add user-user similarity recommendations
- [ ] **Time-Series Analysis**: Price trend prediction and market forecasting
- [ ] **Natural Language Processing**: Sentiment analysis of property descriptions and reviews

### Phase 2: Advanced Features
- [ ] **Virtual Property Tours**: 360° virtual reality property viewing
- [ ] **AI Chatbot**: Intelligent property search assistant
- [ ] **Market Analytics Dashboard**: Comprehensive market insights and trends
- [ ] **Property Comparison Tool**: Side-by-side property comparison with detailed metrics

### Phase 3: User Experience
- [ ] **Mobile Applications**: Native iOS and Android apps
- [ ] **Push Notifications**: Price alerts and new listing notifications
- [ ] **Social Features**: Share properties, create wishlists with friends
- [ ] **Agent Integration**: Connect users with real estate agents

### Phase 4: Data Expansion
- [ ] **Multi-City Support**: Expand to additional metropolitan areas
- [ ] **Historical Data**: Property price history and appreciation tracking
- [ ] **School Ratings**: Integration with education quality databases
- [ ] **Climate Data**: Environmental factors and sustainability scores

### Phase 5: Enterprise Features
- [ ] **API Marketplace**: Public API for third-party integrations
- [ ] **White-Label Solution**: Customizable platform for real estate agencies
- [ ] **Advanced Analytics**: Business intelligence dashboard for stakeholders
- [ ] **Blockchain Integration**: Property ownership verification and smart contracts

### Phase 6: AI Innovation
- [ ] **Computer Vision**: Automatic property feature detection from images
- [ ] **Predictive Maintenance**: Property condition prediction
- [ ] **Demand Forecasting**: Market demand prediction models
- [ ] **Personalized Pricing**: Dynamic pricing recommendations

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Contributors

- **Development Team**: SmartLivingAdvisor Engineering
- **Data Science**: ML & Analytics Team
- **Design**: UX/UI Team

---

## 📞 Contact & Support

- **Email**: support@smartlivingadvisor.com
- **Documentation**: [docs.smartlivingadvisor.com](https://docs.smartlivingadvisor.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/SmartLivingAdvisor/issues)

---

<div align="center">

**Built with ❤️ by the SmartLivingAdvisor Team**

*Making intelligent real estate decisions accessible to everyone*

</div>

