-- Access request review status for superadmin approval workflow.
-- Run against the prospect_discover schema database.

ALTER TABLE prospect_discover.requests
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE prospect_discover.requests
  DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE prospect_discover.requests
  ADD CONSTRAINT requests_status_check
  CHECK (status IN ('active', 'approved', 'denied'));

CREATE INDEX IF NOT EXISTS idx_requests_status
  ON prospect_discover.requests (status);
