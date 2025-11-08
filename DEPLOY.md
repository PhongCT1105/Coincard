# Deployment Guide (Vercel Monorepo)

## Projects
Create two Vercel projects that point at the same Git repository:

1. **Coincard Backend**
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Output directory: *leave blank* (serverless function)
   - Serverless entry: `api/index.py` exposes the FastAPI `app`.
   - Environment variables (Production + Preview): copy everything from `backend/src/.env` plus the runtime secrets (`XAI_API_KEY`, `XAI_MODEL` if overriding, `BEARER_TOKEN` for X, all Snowflake creds, etc.).
   - Recommended: add `VERCEL_ENV`-specific overrides if you want different Snowflake roles for dev/prod.

2. **Coincard Frontend**
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variables: define `VITE_API_BASE_URL` (e.g. `https://coincard-backend.vercel.app`). Preview deployments can point at the backend preview URL; Production should reference the production backend domain.

## Local Development
- Backend: `cd backend && uvicorn src.main:app --reload --port 8000`
- Frontend: `cd frontend && npm install && npm run dev`
- Copy `frontend/.env.example` to `.env` if you need to override the API base locally.

## Deploy Flow
1. Commit changes and push to GitHub.
2. Vercel automatically triggers Preview builds for both projects (because their root directories differ, each build only touches its project files).
3. Test preview URLs end-to-end.
4. Merge to main (or promote previews) to ship to Production.

## Troubleshooting
- **Imports failing inside serverless backend**: ensure new dependencies are listed in `backend/requirements.txt`.
- **CORS errors**: update `settings.cors_origins` in `backend/src/settings.py` or set `CORS_ORIGINS` env var with the deployed frontend domain.
- **Frontend hitting localhost in production**: verify `VITE_API_BASE_URL` is set for both Preview and Production environments.
