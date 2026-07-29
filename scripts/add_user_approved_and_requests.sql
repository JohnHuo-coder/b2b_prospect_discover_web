-- Platform access approval + access request notes.
-- Run against the prospect_discover schema database.

ALTER TABLE prospect_discover.users
  ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT false;

-- Existing users keep access until explicitly reviewed.
UPDATE prospect_discover.users
SET approved = true
WHERE approved = false;

CREATE TABLE IF NOT EXISTS prospect_discover.requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES prospect_discover.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_user_id
  ON prospect_discover.requests (user_id);
