# Deploying PathFinder
- Frontend: `cd frontend && npm run build` → serve `frontend/dist` (Vercel/Netlify/nginx).
- Backend: Node 20+ on Render/Railway/VPS: `cd backend && npm ci && npm start`.
- Database: managed PostgreSQL 16, run `database/schema.sql` once.
- nginx: proxy `/api/` → `http://127.0.0.1:8000/`, serve `dist` with SPA fallback to `index.html`.

## Production checklist
- Long random `JWT_SECRET` (32+ chars); `SEED_ON_START=false` after first run; change demo passwords.
- `CORS_ORIGIN` = your site only; `CORS_ORIGIN_REGEX` empty.
- Real receiving accounts in Admin → Payment accounts.
- AI key set (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`). Never commit `.env`.
