export const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";

export const GMAIL_USERINFO_EMAIL_SCOPE =
  "https://www.googleapis.com/auth/userinfo.email";

export const GMAIL_OAUTH_SCOPES = [
  GMAIL_SEND_SCOPE,
  GMAIL_USERINFO_EMAIL_SCOPE,
] as const;

export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export const DEFAULT_OUTREACH_SUBJECT = "Introduction";
