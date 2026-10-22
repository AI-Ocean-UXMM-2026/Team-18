-- Pro payment requests no longer require students to submit a transaction ID.
-- Preserve existing receipt IDs and keep the unique constraint for older submissions.
ALTER TABLE public.payments
  ALTER COLUMN transaction_id DROP NOT NULL;
