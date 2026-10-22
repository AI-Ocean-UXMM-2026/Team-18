-- Store universities added by admin accounts independently of Google Sheets.
CREATE TABLE IF NOT EXISTS public.admin_universities (
  id          VARCHAR(60) PRIMARY KEY,
  data        JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_by  INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
