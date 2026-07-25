CREATE TABLE IF NOT EXISTS prospect_discover.user_gmail_connections (
  user_id INTEGER PRIMARY KEY
    REFERENCES prospect_discover.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expiry TIMESTAMPTZ,
  scopes TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
