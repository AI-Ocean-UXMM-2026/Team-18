# Deploying CareerNet
- Frontend: `cd frontend && npm run build` → serve `frontend/dist` (Vercel/Netlify/nginx).
- Backend: Node 20+ on Render/Railway/VPS: `cd backend && npm ci && npm start`.
- Database: managed PostgreSQL 16, run `database/schema.sql` once.
- nginx: proxy `/api/` → `http://127.0.0.1:8000/`, serve `dist` with SPA fallback to `index.html`.

## Production checklist
- Long random `JWT_SECRET` (32+ chars); `SEED_ON_START=false` after initial setup for a normal production site.
- For a public demo, `SEED_ON_START=true` restores all seeded demo account passwords from `SEED_PASSWORD` on each backend start. The shared Super admin credentials are public on the sign-in page, so use this only with demo data.
- `CORS_ORIGIN` = your site only; `CORS_ORIGIN_REGEX` empty.
- Real receiving accounts in Admin → Payment accounts.
- AI key set (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`). Never commit `.env`.
