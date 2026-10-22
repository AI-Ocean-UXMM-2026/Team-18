-- Store careers and quiz questions added through the Admin content importer.
CREATE TABLE IF NOT EXISTS public.admin_content (
  content_type TEXT NOT NULL CHECK (content_type IN ('career', 'question')),
  content_id   TEXT NOT NULL,
  data         JSONB NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  created_by   INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_type, content_id)
);
