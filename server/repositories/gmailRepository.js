import gmailConnectionProvider from '../providers/gmailConnectionProvider.js';
import {
  exchangeGmailCode,
  fetchGmailProfileEmail,
  getGmailAuthUrl,
  sendGmailMessage,
} from '../services/gmailService.js';
import { GMAIL_SEND_SCOPE } from '../../lib/constants/gmail.ts';

const gmailRepository = {
  ensureTable: () => gmailConnectionProvider.ensureTable(),

  getAuthUrl: (state) => getGmailAuthUrl(state),

  async getStatus(userId) {
    const connection = await gmailConnectionProvider.getConnectionByUserId(userId);
    if (!connection) {
      return { connected: false, email: null };
    }

    return {
      connected: true,
      email: connection.google_email,
    };
  },

  async handleOAuthCallback({ userId, code }) {
    const tokens = await exchangeGmailCode(code);
    if (!tokens.refresh_token) {
      throw new Error('Google did not return a refresh token. Please reconnect and grant access again.');
    }

    const googleEmail =
      (tokens.access_token
        ? await fetchGmailProfileEmail(tokens.access_token)
        : null) || null;

    if (!googleEmail) {
      throw new Error('Unable to determine connected Gmail address');
    }

    await gmailConnectionProvider.upsertConnection({
      userId,
      googleEmail,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token || null,
      tokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      scopes: GMAIL_SEND_SCOPE,
    });

    return { connected: true, email: googleEmail };
  },

  async sendOutreachEmail({
    userId,
    to,
    subject,
    body,
    senderName,
  }) {
    const connection = await gmailConnectionProvider.getConnectionByUserId(userId);
    if (!connection?.refresh_token) {
      throw new Error('Gmail is not connected');
    }

    const result = await sendGmailMessage({
      refreshToken: connection.refresh_token,
      accessToken: connection.access_token,
      tokenExpiry: connection.token_expiry,
      to,
      subject,
      body,
      fromName: senderName,
      fromEmail: connection.google_email,
    });

    if (result.accessToken) {
      await gmailConnectionProvider.updateAccessToken({
        userId,
        accessToken: result.accessToken,
        tokenExpiry: result.tokenExpiry,
      });
    }

    return { fromEmail: connection.google_email };
  },
};

export default gmailRepository;
