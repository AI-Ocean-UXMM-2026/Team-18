# Team-18

# CareerNet
Career guidance for Grade 12 / GED / IGCSE students in Myanmar. Three portals: Student, Mentor, Admin.

```
CareerNet/
  database/  schema.sql, reset.sql
  backend/   Express + TypeScript API (src/, data/, .env.example)
  frontend/  Vite + React + Tailwind (src/pages/{student,mentor,admin})
  deploy/    deployment notes
```

## Run locally
1. Install Node 20+ and PostgreSQL 16. Create DB `careernet_db`, run `database/schema.sql`.
2. `cd backend && cp .env.example .env` → set DATABASE_URL, JWT_SECRET, AI key. `npm install && npm run dev` (port 8000).
3. `cd frontend && cp .env.example .env && npm install && npm run dev` → http://localhost:5173

## Demo accounts (password `careernet123`, from SEED_PASSWORD)
- Normal student: `student@careernet.local` (free AI allowance)
- Pro student: `pro@careernet.local` (unlimited AI and PDF report; sample quiz profile included)
- Mentor: `hnin@mentor.careernet.local`
- Admins: `super@`, `ops@`, and `content@careernet.local`

## Rules worth knowing
- Mentor booking is a Pro feature (checked in the API too). Approve a payment in Admin → Payments to test it.
- Student journey auto-saves to the account (no Save button). Back links sit at the top-left of each page.
- Pro payment has a confirm step before it is sent to the admin.

## Data
- Grade 12: `backend/data/g12.json` (+ photos in `frontend/public/universities`).
- GED/IGCSE: Google Sheet published as CSV (`SCHOOLS_SHEET_CSV_URL`), fallback `backend/data/schools.csv`; template `careernet_schools_template.xlsx`.
- UI Myanmar text: `frontend/src/lib/i18n.ts`.
