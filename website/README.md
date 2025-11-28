# SmartLivingAdvisor Web Experience

This folder contains the fresh web stack inspired by Zillow while staying on-brand for SmartLivingAdvisor.

## Structure

- `frontend/`: Vite + React app (JavaScript) that renders the full landing experience described in the design prompt.
- `backend/`: FastAPI scaffold that exposes `/health` and `/listings` endpoints so the frontend can eventually pull real data.
- `assests/ → website/frontend/public/assets/`: Pixel assets copied into the Vite public directory to make them available at runtime.

## Visual System (Palette)

| Purpose | HEX |
| --- | --- |
| Primary Brand | `#004F52` |
| Primary Dark | `#00383A` |
| Primary Light | `#4FAFB2` |
| Accent Yellow | `#F4A340` |
| Accent Coral | `#EF6C48` |
| Accent Blue | `#2D9CDB` |
| Accent Mint | `#52D1C6` |
| Background | `#F9FAFB` |
| Text Dark | `#111827` |
| Text Body | `#374151` |
| Subtext | `#9CA3AF` |

These values are available as CSS custom properties in `src/index.css` and `src/App.css`.

## Frontend Highlights

- Hero section with bold typography, teal/blue gradient, city-search pill, and messaging that mirrors the creative brief.
- Three service cards (Smart Property Matching, Neighborhood Insights, Personalized Recommendations) using rounded cards, custom icons, and accent backgrounds.
- Featured listings grid (6 properties) with badges (“Excellent Match”, “High Score”, “New Listing”) and Smart Living Scores.
- “Get in Touch” CTA featuring the provided illustration, copy, and dual CTA buttons.
- Multi-column footer inspired by Zillow’s structure plus skyline strip artwork.

The project already imports Google Font **Inter** for modern, readable typography.

## Backend Highlights

- FastAPI app defined in `backend/app/main.py` with health check and mock listings endpoint.
- Shared `Listing` schema ensures the frontend/ backend contract is typed even before the real recommender service is wired in.
- Neon-powered `/listings` endpoint pulls the featured cards straight from `public.real_estate_data`, including badges and formatted metadata.
- Install dependencies via `pip install -r website/backend/requirements.txt` and run locally with `uvicorn app.main:app --reload --app-dir website/backend`.

### Environment Variables

- `DATABASE_URL` (backend): standard Neon connection string, e.g. `postgresql+psycopg://user:pass@host/db`.
- `CORS_ALLOW_ORIGINS` (backend, optional): comma-separated origins allowed to call the API (defaults to `*` for local dev).
- `VITE_API_URL` (frontend): base URL for the FastAPI service (defaults to `http://localhost:8000` when unset).

## Next Steps

1. Extend the backend with recommendation + search endpoints backed by the Neon+ML models.
2. Add authentication and saved-homes experiences to the frontend.
3. Layer on integration tests that validate the `/listings` contract end to end.

