-- Company description for business configuration / email generation.
ALTER TABLE prospect_discover.business_configs
  ADD COLUMN IF NOT EXISTS description TEXT;
