import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { errorResponse, jsonResponse } from '@/lib/api/response';
import { withAuth } from '@/lib/api/middleware/authMiddleware.js';
import { GMAIL_OAUTH_STATE_COOKIE } from '@/lib/constants/gmail';
import gmailRepository from '@/server/repositories/gmailRepository.js';

type DbUser = {
  id?: number | string | null;
};

type ConnectPayload = {
  returnTo?: string | null;
  leadId?: string | null;
  contactEmail?: string | null;
  contactEmails?: string[] | null;
  autoSend?: boolean;
  autoBulkSend?: boolean;
};

const OAUTH_STATE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 600,
  path: '/',
};

function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return '/dashboard';
  }
  return value;
}

function buildConnectResponse(payload: ConnectPayload) {
  const returnTo = sanitizeReturnTo(payload.returnTo ?? '/dashboard');
  const contactEmails = Array.isArray(payload.contactEmails)
    ? payload.contactEmails.map((email) => email.trim()).filter(Boolean).join(',')
    : null;

  const state = crypto.randomBytes(24).toString('base64url');
  const authUrl = gmailRepository.getAuthUrl(state);

  const response = jsonResponse({ url: authUrl });
  response.cookies.set(
    GMAIL_OAUTH_STATE_COOKIE,
    JSON.stringify({
      state,
      returnTo,
      leadId: payload.leadId?.trim() || null,
      contactEmail: payload.contactEmail?.trim() || null,
      contactEmails,
      autoSend: Boolean(payload.autoSend),
      autoBulkSend: Boolean(payload.autoBulkSend),
    }),
    OAUTH_STATE_COOKIE
  );

  return response;
}

export const POST = withAuth(async (request: Request, _context: unknown, user: DbUser) => {
  try {
    if (!user.id) {
      return errorResponse('User not found', 401);
    }

    const body = (await request.json()) as ConnectPayload;
    return buildConnectResponse(body);
  } catch (error) {
    console.error('[POST /api/gmail/connect]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to start Gmail connection';
    return errorResponse(message, 500);
  }
});
