-- Career video files are stored in Supabase Storage; PostgreSQL stores references only.
CREATE TABLE IF NOT EXISTS public.admin_career_videos (
  career_id    TEXT PRIMARY KEY,
  object_path  TEXT NOT NULL,
  video_url    TEXT NOT NULL,
  video_length TEXT NOT NULL DEFAULT '',
  updated_by   INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
