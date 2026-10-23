-- Run before deploying the monthly Pro backend. Safe to run again.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_expires_at TIMESTAMPTZ;
-- Existing paid memberships expire one calendar month after their latest approval.
-- Existing manually granted/demo memberships get one month from this migration.
UPDATE users u SET pro_expires_at = COALESCE(
  (SELECT MAX(p.decided_at) FROM payments p WHERE p.student_id = u.id AND p.status = 'approved'),
  now()
) + INTERVAL '1 month'
WHERE u.is_pro AND u.pro_expires_at IS NULL;
COMMIT;
