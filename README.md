# CareerNest

CareerNest is a career guidance app for Grade 12, GED, and IGCSE students in Myanmar. It has student, mentor, and admin portals, a career matching quiz, AI career guidance, university discovery, mentor booking, and a Pro PDF report.

## Current live demo

- Website: [careernest.onrender.com](https://careernest.onrender.com)
- API health: [careernet-api.onrender.com/health](https://careernet-api.onrender.com/health)
- Hosting: Render serves the frontend and API; Supabase provides PostgreSQL.

## Student journey

1. Start as a guest or create a student account.
2. Choose an education level and complete the 20-question career quiz.
3. Review career matches and the Holland code. The optional short career videos can help with choosing a career.
4. Choose a career and related majors, explore universities and colleges, and compare options.
5. Continue to the plan, which brings together the selected career, shortlist, mentor sessions, and next steps.

Guest sessions can use the career exploration flow, but progress is temporary. Guests cannot use the AI coach, save progress to an account, submit Pro payments, book mentors, or download the Pro report. Register or sign in as a student to save the journey. Signed-in student progress is saved automatically.

Student navigation uses one left drawer opened by the menu button. Later steps remain disabled until their prerequisites are complete: choose an education level → answer every quiz question and finish → review results → choose a career → select and confirm majors → select at least two universities to compare → save the comparison → view the plan or optionally book a mentor with Pro. The same rules guard direct URLs. Editing an earlier choice locks dependent steps again. Profile/settings and Pro account information remain accessible throughout. Existing saved progress is retained.

## AI, Pro, and payments

- Signed-in normal students have the configured free AI allowance (`FREE_AI_LIMIT`, default 5). Pro students have unlimited AI career coach and university advisor usage.
- CareerNest tries the configured primary AI provider, then its configured fallback provider when applicable. See [deploy/README.md](deploy/README.md) for provider and key configuration.
- Pro includes the full PDF report and mentor sessions. The PDF is generated in the browser from the student's saved journey; it does not call the AI API.
- Students request Pro from the student portal by submitting the amount and a payment screenshot; a transaction ID is not required. An admin verifies that the money arrived in the CareerNest payment account before approving under **Admin → Payments**. Mentor booking and Pro entitlements are checked by the API.

## Portals

- Student: `/login` and `/student/...`
- Mentor: `/mentor/login`; new mentors can apply at `/mentor/apply`. Applications need admin review before mentor sign-in is enabled.
- Admin: `/admin/login`. Admin roles have different access to payments, mentors, students, universities, content, payment accounts, and admin management.

## Demo accounts

The sign-in pages include buttons to fill in the demo credentials. All seeded demo accounts use the password `careernet123` when `SEED_PASSWORD` has its default value.

| Role | Email | Notes |
| --- | --- | --- |
| Student | `student@careernet.local` | Normal account with the configured free AI allowance |
| Student | `pro@careernet.local` | Pro with a sample completed quiz and career; confirm a university comparison to open the plan and PDF |
| Mentor | `hnin@mentor.careernet.local` | Active demo mentor with availability |
| Admin | `super@careernet.local` | Full admin access |

The demo provides one account for each portal, plus separate normal and Pro student accounts. The sign-in page's **Use account** buttons fill in the matching email and password. With the default `SEED_PASSWORD=careernet123`, the backend restores the four demo accounts on startup and resets student AI usage. Seeding also disables the old Operations admin, Content editor, and extra mentor demo accounts while retaining their records. Keep `SEED_ON_START=true` only for a demo database. For a real deployment, disable it after setup and replace shared demo credentials. Never publish a real `.env` file or commit API keys.

## Run locally

Requirements: Node.js 20 or later and PostgreSQL 16 or a compatible PostgreSQL service.

1. Create a database named `careernet_db` and apply the schema from the repository root:

   ```sh
   psql "$DATABASE_URL" -f database/schema.sql
   ```

   On Windows PowerShell, use `psql "postgresql://USER:PASSWORD@HOST:5432/careernet_db" -f database/schema.sql` with your database connection details.

   For an existing database, apply every SQL script in `database/migrations/` after the schema, in filename order. These migrations include admin-managed university and content storage, optional payment transaction IDs, and career video references.

2. Configure the backend:

   ```sh
   cd backend
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`. Set `DATABASE_URL` and a long random `JWT_SECRET` in `backend/.env`. Add an AI provider key if you want to use AI features. The backend listens on port 8000 by default and exposes `/health`.

3. Install backend dependencies and start the API:

   ```sh
   npm install
   npm run dev
   ```

4. In a second terminal, configure and start the frontend:

   ```sh
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` for the copy step. Open [http://localhost:5173](http://localhost:5173). By default, Vite proxies `/api` requests to `http://127.0.0.1:8000`; set `VITE_BACKEND_URL` in `frontend/.env` only when the API runs on a different host.

## Checks and production builds

Run these from the corresponding `backend` or `frontend` directory:

```sh
npm run check
npm run build
```

The backend also provides `npm test`, `npm run seed`, and `npm start`. The frontend uses `npm run preview` to preview a production build locally.

## Data and project layout

- `database/schema.sql` and `database/migrations/` — PostgreSQL schema and incremental database changes.
- `backend/src/` — Express API, authentication, role checks, AI endpoints, and seed data.
- `backend/data/g12.json` — Grade 12 university and major data.
- `backend/data/schools.csv` — fallback GED/IGCSE school data. Set `SCHOOLS_SHEET_CSV_URL` to use a published Google Sheets CSV instead. Admins can add universities directly in Admin → Universities or fill the Excel template and import it as CSV; records are stored in PostgreSQL and appear alongside imported entries.
- `frontend/src/` — React app, role portals, translations, journey state, and client-side PDF generation.
- `frontend/public/universities/` — university photos.
- `deploy/README.md` — hosting, production environment, and AI failover details.
