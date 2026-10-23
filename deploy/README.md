# Deploying CareerNest
- Frontend: `cd frontend && npm run build` → serve `frontend/dist` (Vercel/Netlify/nginx).
- Backend: Node 20+ on Render/Railway/VPS: `cd backend && npm ci && npm start`.
- Database: managed PostgreSQL 16, run `database/schema.sql` once and then apply scripts in `database/migrations/` to existing databases.
- nginx: proxy `/api/` → `http://127.0.0.1:8000/`, serve `dist` with SPA fallback to `index.html`.

## Production checklist
- Long random `JWT_SECRET` (32+ chars); `SEED_ON_START=false` after initial setup for a normal production site.
- For a public demo, `SEED_ON_START=true` restores all seeded demo account passwords from `SEED_PASSWORD` on each backend start. The shared Super admin credentials are public on the sign-in page, so use this only with demo data.
- `CORS_ORIGIN` = your site only; `CORS_ORIGIN_REGEX` empty.
- Real receiving accounts in Admin → Payment accounts.
- AI keys set in the backend host environment (for example, Render → backend service → Environment). Never commit `.env`.
- Password reset emails use Resend. Set `RESEND_API_KEY`, a verified `EMAIL_FROM` address, and `PUBLIC_APP_URL` (the deployed frontend URL) in the backend host environment. The backend installs the additive password recovery schema on startup; `database/migrations/20261023_password_recovery.sql` remains available for manual installation. The email link verifies ownership before the user can choose a password or generate and display a new password. `/health` reports `passwordRecovery.available`, `passwordRecovery.emailConfigured`, and the Render Git release. A 404 on `POST /auth/password/forgot` means the backend is running an older release: deploy the latest `main` commit on the backend service as well as the frontend.
- Direct career video uploads use Supabase Storage. Set `SUPABASE_URL` and the backend-only `SUPABASE_SERVICE_ROLE_KEY` on the backend host, then apply `database/migrations/20261022_admin_career_videos.sql`. The first admin upload creates a public `career-videos` bucket automatically. Videos must be MP4 (H.264 video and AAC audio recommended), no longer than 4 minutes, and at most 300 MB. Set the Supabase Storage global file size limit to at least 300 MB. Supabase Free projects cap individual uploads at 50 MB, so larger files require a paid Supabase plan. Existing bucket limits are raised automatically when a larger upload is requested.

## AI provider failover
- With `AI_PROVIDER=gemini`, CareerNest tries `GEMINI_API_KEY` first. If Gemini returns HTTP 429, it tries `GEMINI_FALLBACK_API_KEY` once when set. Other Gemini failures go directly to OpenRouter when configured.
- Set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` to enable the second AI provider. CareerNest will call OpenRouter only when the model name ends in `:free`, so a paid model cannot be used accidentally. The default is `nvidia/nemotron-3.5-lightning:free`.
- `OPENROUTER_REFERER` identifies the deployed CareerNest website. Set it to your public frontend URL if the domain changes.
- Provider keys are optional alternatives: Gemini can run on its own; OpenRouter can run directly if no Gemini key is set. If both providers fail, the API returns a generic retry message while provider diagnostics stay in backend logs.
- `AI_PROVIDER=claude` continues to use Anthropic directly and does not use the Gemini/OpenRouter failover chain.
