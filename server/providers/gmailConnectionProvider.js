import { pool } from '../../lib/db/client.ts';
import { encryptToken, decryptToken } from '../utils/tokenEncryption.js';

let tableReadyPromise = null;

function ensureTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = pool.query(`
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
      )
    `);
  }

  return tableReadyPromise;
}

function mapConnectionRow(row) {
  if (!row) return null;

  return {
    google_email: row.google_email,
    refresh_token: decryptToken(row.refresh_token),
    access_token: row.access_token ? decryptToken(row.access_token) : null,
    token_expiry: row.token_expiry,
    scopes: row.scopes,
    connected_at: row.connected_at,
  };
}

export default {
  ensureTable,

  async getConnectionByUserId(userId) {
    await ensureTable();
    const { rows } = await pool.query(
      `SELECT user_id, google_email, refresh_token, access_token, token_expiry, scopes, connected_at
       FROM prospect_discover.user_gmail_connections
       WHERE user_id = $1`,
      [userId]
    );

    return mapConnectionRow(rows[0] ?? null);
  },

  async upsertConnection({
    userId,
    googleEmail,
    refreshToken,
    accessToken = null,
    tokenExpiry = null,
    scopes = null,
  }) {
    await ensureTable();

    const { rows } = await pool.query(
      `INSERT INTO prospect_discover.user_gmail_connections
         (user_id, google_email, refresh_token, access_token, token_expiry, scopes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         google_email = EXCLUDED.google_email,
         refresh_token = EXCLUDED.refresh_token,
         access_token = EXCLUDED.access_token,
         token_expiry = EXCLUDED.token_expiry,
         scopes = EXCLUDED.scopes,
         updated_at = NOW()
       RETURNING user_id, google_email, refresh_token, access_token, token_expiry, scopes, connected_at`,
      [
        userId,
        googleEmail,
        encryptToken(refreshToken),
        accessToken ? encryptToken(accessToken) : null,
        tokenExpiry,
        scopes,
      ]
    );

    return mapConnectionRow(rows[0]);
  },

  async updateAccessToken({ userId, accessToken, tokenExpiry }) {
    await ensureTable();
    await pool.query(
      `UPDATE prospect_discover.user_gmail_connections
       SET access_token = $2,
           token_expiry = $3,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, accessToken ? encryptToken(accessToken) : null, tokenExpiry]
    );
  },

  async deleteConnection(userId) {
    await ensureTable();
    const { rowCount } = await pool.query(
      `DELETE FROM prospect_discover.user_gmail_connections WHERE user_id = $1`,
      [userId]
    );
    return { affectedRows: rowCount };
  },
};
