-- Superadmin home-company tracking when monitoring other businesses.
ALTER TABLE prospect_discover.users
  ADD COLUMN IF NOT EXISTS original_business_id INTEGER
  REFERENCES prospect_discover.businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_original_business_id
  ON prospect_discover.users (original_business_id);
