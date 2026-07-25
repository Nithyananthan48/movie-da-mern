# Movie Rating Aggregator MVP

Monorepo with:
- `frontend`: React + TypeScript + Vite
- `backend`: Node + TypeScript + Express + Prisma + PostgreSQL

## Quick start

1. Install Node.js 20+ and npm.
2. Install dependencies:
   - `npm install`
3. Configure env files:
   - `backend/.env` from `backend/.env.example`
   - `frontend/.env` from `frontend/.env.example`
4. Run database migration:
   - `npm run prisma:migrate --workspace backend`
   - `npm run prisma:seed --workspace backend`
5. Start dev servers:
   - `npm run dev`

## API health

- `GET /health`

## Deployment

- Frontend: Vercel/Netlify
- Backend + Postgres: Render/Railway/Fly
