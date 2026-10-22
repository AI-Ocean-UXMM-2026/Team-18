-- ===========================================================================
--  CareerNet — PostgreSQL schema
--  Career guidance for Grade 12 / GED / IGCSE students
--
--  HOW TO RUN (pgAdmin4)
--   1. Create a database named  careernet_db
--   2. Open Tools -> Query Tool on it, open this file, press F5.
--
--  HOW TO RUN (command line)
--      createdb -U postgres careernet_db
--      psql -U postgres -d careernet_db -f database/schema.sql
--
--  Idempotent: running it twice is safe. To start over run reset.sql first.
--  You do NOT insert accounts by hand: the backend seeds demo admin and
--  mentor accounts on first start (backend/src/seed.ts) when SEED_ON_START=true.
--
--  Base GED / IGCSE school data can come from a Google Sheet or CSV. Admin-added
--  schools are stored in admin_universities. Grade 12 data is in backend/data/g12.json.
-- ===========================================================================

BEGIN;

DO $$ BEGIN CREATE TYPE user_role      AS ENUM ('student', 'mentor', 'admin');                         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE admin_role     AS ENUM ('super', 'ops', 'content');                            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE mentor_status  AS ENUM ('pending', 'active', 'rejected', 'suspended');         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show', 'expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected', 'disputed');        EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. Accounts: one table for all three portals --------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  email          VARCHAR(320) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,            -- scrypt, see backend/src/auth.ts
  name           TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'student',
  admin_role     admin_role,                        -- only for role = 'admin'
  language       VARCHAR(2) NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'my')),
  is_pro         BOOLEAN NOT NULL DEFAULT false,
  ai_used        INTEGER NOT NULL DEFAULT 0,        -- free users get FREE_AI_LIMIT questions
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((role = 'admin') = (admin_role IS NOT NULL))
);

-- 2. Student journey (quiz answers, career, majors, shortlist) ----------------
CREATE TABLE IF NOT EXISTS journeys (
  student_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data         JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Mentors ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentors (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,                       -- e.g. "Senior Software Engineer, fintech"
  years        INTEGER NOT NULL DEFAULT 0 CHECK (years >= 0),
  fields       INTEGER[] NOT NULL DEFAULT '{}',     -- 1 IT, 2 Engineering, 3 Medicine …
  languages    TEXT NOT NULL DEFAULT 'Myanmar · English',
  bio          TEXT,
  status       mentor_status NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Times a mentor is free. Students can only book these.
CREATE TABLE IF NOT EXISTS mentor_slots (
  id           SERIAL PRIMARY KEY,
  mentor_id    INTEGER NOT NULL REFERENCES mentors(user_id) ON DELETE CASCADE,
  starts_at    TIMESTAMPTZ NOT NULL,
  minutes      INTEGER NOT NULL DEFAULT 60,
  UNIQUE (mentor_id, starts_at)
);

-- Booking requests: pending until the mentor accepts.
CREATE TABLE IF NOT EXISTS bookings (
  id            SERIAL PRIMARY KEY,
  slot_id       INTEGER NOT NULL REFERENCES mentor_slots(id) ON DELETE CASCADE,
  mentor_id     INTEGER NOT NULL REFERENCES mentors(user_id) ON DELETE CASCADE,
  student_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        booking_status NOT NULL DEFAULT 'pending',
  question      TEXT,
  meeting_link  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at  TIMESTAMPTZ
);
-- one live booking per slot
CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_live_per_slot ON bookings(slot_id) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS bookings_mentor ON bookings(mentor_id, status);
CREATE INDEX IF NOT EXISTS bookings_student ON bookings(student_id, status);

-- 4. Pro payments: screenshot -> admin confirms -> student becomes Pro --------
CREATE TABLE IF NOT EXISTS payment_accounts (
  provider        VARCHAR(16) PRIMARY KEY,          -- kbz, wave, aya, uab, mytel
  label           TEXT NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  account_name    TEXT NOT NULL DEFAULT '',
  account_number  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS payments (
  id                 SERIAL PRIMARY KEY,
  student_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_key        UUID NOT NULL UNIQUE,          -- the same submission twice = one payment
  provider           VARCHAR(16) NOT NULL,
  account_name       TEXT NOT NULL,                 -- snapshot of where the student paid
  account_number     TEXT NOT NULL,
  amount_mmk         INTEGER NOT NULL CHECK (amount_mmk > 0),
  transaction_id     VARCHAR(30) UNIQUE,             -- optional receipt reference; older submissions may include it
  proof_data         TEXT,                          -- data URL, max 1 MB image; deleted after retention
  proof_sha256       CHAR(64) NOT NULL UNIQUE,      -- the same screenshot cannot be reused
  status             payment_status NOT NULL DEFAULT 'pending',
  reason             VARCHAR(300),                  -- required when rejected
  dispute_used       BOOLEAN NOT NULL DEFAULT false,
  decided_by         INTEGER REFERENCES users(id),
  decided_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_status ON payments(status, created_at);
-- one open request per student
CREATE UNIQUE INDEX IF NOT EXISTS payments_one_open_per_student ON payments(student_id) WHERE status IN ('pending', 'disputed');

-- 5. Audit log: who did what -------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  actor_id    INTEGER REFERENCES users(id),
  action      TEXT NOT NULL,                        -- e.g. payment.approve, mentor.approve
  target      TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin-added GED / IGCSE universities appear alongside Sheet/CSV imports.
CREATE TABLE IF NOT EXISTS admin_universities (
  id          VARCHAR(60) PRIMARY KEY,
  data        JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default receiving accounts (edit them in Admin -> Payment accounts)
INSERT INTO payment_accounts (provider, label, enabled) VALUES
  ('kbz', 'KBZPay', true), ('wave', 'Wave Money', true), ('aya', 'AYA Pay', true),
  ('uab', 'UAB Pay', false), ('mytel', 'MytelPay', false)
ON CONFLICT (provider) DO NOTHING;

COMMIT;
