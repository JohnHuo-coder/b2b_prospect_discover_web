import { NextRequest, NextResponse } from 'next/server';
import '@/lib/firebase/firebase.js';
import { getAuth } from 'firebase-admin/auth';
import { GMAIL_OAUTH_STATE_COOKIE } from '@/lib/constants/gmail';
import gmailRepository from '@/server/repositories/gmailRepository.js';
import userRepository from '@/server/repositories/userRepository.js';

type DbUser = {
  id?: number | string | null;
};

function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith('/')) {
    return '/dashboard';
  }
  return value;
}

function buildRedirectUrl(
  returnTo: string,
  params: Record<string, string | null | undefined>
) {
  const url = new URL(returnTo, 'http://local');
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }
  return `${url.pathname}${url.search}`;
}

async function resolveGmailCallbackUser(
  request: NextRequest
): Promise<DbUser | null> {
  const token =
    request.cookies.get('session')?.value ||
    request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return userRepository.findByUid(decodedToken.uid);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const fallbackRedirect = '/dashboard?gmail=error';

  try {
    const user = await resolveGmailCallbackUser(request);
    if (!user?.id) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnTo', '/dashboard');
      loginUrl.searchParams.set('gmail', 'auth-required');
      return NextResponse.redirect(loginUrl);
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error');

    const storedStateRaw = request.cookies.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

    if (oauthError) {
      return NextResponse.redirect(
        buildRedirectUrl('/dashboard', { gmail: 'denied' })
      );
    }

    if (!code || !state || !storedStateRaw) {
      return NextResponse.redirect(
        buildRedirectUrl('/dashboard', { gmail: 'error', reason: 'state' })
      );
    }

    let storedState: {
      state?: string;
      returnTo?: string;
      leadId?: string | null;
      contactEmail?: string | null;
      contactEmails?: string | null;
      autoSend?: boolean;
      autoBulkSend?: boolean;
    };

    try {
      storedState = JSON.parse(storedStateRaw);
    } catch {
      return NextResponse.redirect(
        buildRedirectUrl('/dashboard', { gmail: 'error', reason: 'state' })
      );
    }

    if (!storedState.state || storedState.state !== state) {
      return NextResponse.redirect(
        buildRedirectUrl('/dashboard', { gmail: 'error', reason: 'state' })
      );
    }

    await gmailRepository.handleOAuthCallback({
      userId: user.id,
      code,
    });

    const returnTo = sanitizeReturnTo(storedState.returnTo ?? '/dashboard');
    const redirectPath = buildRedirectUrl(returnTo, {
      gmail: 'connected',
      autoSend: storedState.autoSend ? '1' : null,
      autoBulkSend: storedState.autoBulkSend ? '1' : null,
      contactEmail: storedState.contactEmail,
      contactEmails: storedState.contactEmails,
      leadId: storedState.leadId,
    });

    const successResponse = NextResponse.redirect(redirectPath);
    successResponse.cookies.delete(GMAIL_OAUTH_STATE_COOKIE);
    return successResponse;
  } catch (error) {
    console.error('[GET /api/gmail/callback]', error);
    return NextResponse.redirect(
      buildRedirectUrl(fallbackRedirect, { reason: 'callback' })
    );
  }
}
