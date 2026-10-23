-- Support contact details shown on the public Contact page.
CREATE TABLE IF NOT EXISTS public.site_settings (
  setting_key TEXT PRIMARY KEY,
  data        JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_by  INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
