import { google } from 'googleapis';
import { GMAIL_OAUTH_SCOPES } from '../../lib/constants/gmail.ts';

function getOAuthClient() {
  const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI?.trim();

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Gmail OAuth is not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl(state) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [...GMAIL_OAUTH_SCOPES],
    state,
  });
}

export async function exchangeGmailCode(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function fetchGmailProfileEmail(accessToken) {
  const client = getOAuthClient();
  client.setCredentials({ access_token: accessToken });
  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data } = await oauth2.userinfo.get();
  return data.email?.trim() || null;
}

function encodeEmailHeader(value) {
  return String(value).replace(/\r?\n/g, ' ').trim();
}

function buildRawEmail({ to, subject, body, fromName, fromEmail }) {
  const fromHeader = fromName
    ? `"${encodeEmailHeader(fromName)}" <${fromEmail}>`
    : fromEmail;

  const message = [
    `From: ${fromHeader}`,
    `To: ${encodeEmailHeader(to)}`,
    `Subject: ${encodeEmailHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailMessage({
  refreshToken,
  accessToken,
  tokenExpiry,
  to,
  subject,
  body,
  fromName,
  fromEmail,
}) {
  const client = getOAuthClient();
  client.setCredentials({
    refresh_token: refreshToken,
    access_token: accessToken || undefined,
    expiry_date: tokenExpiry ? new Date(tokenExpiry).getTime() : undefined,
  });

  const gmail = google.gmail({ version: 'v1', auth: client });
  const raw = buildRawEmail({
    to,
    subject,
    body,
    fromName,
    fromEmail,
  });

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  const credentials = client.credentials;
  return {
    accessToken: credentials.access_token || accessToken || null,
    tokenExpiry: credentials.expiry_date
      ? new Date(credentials.expiry_date).toISOString()
      : tokenExpiry || null,
  };
}
