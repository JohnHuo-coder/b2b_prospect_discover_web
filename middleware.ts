import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SYSTEM_DASHBOARD_API_PREFIX = "/api/system-dashboard";

function getSessionToken(request: NextRequest): string | null {
  const cookieToken = request.cookies.get("session")?.value;
  if (cookieToken) return cookieToken;

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const token = getSessionToken(request);
  if (!token) return false;

  const checkUrl = new URL("/api/auth/admin-check", request.url);
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  const cookieToken = request.cookies.get("session")?.value;
  if (cookieToken) {
    headers.Cookie = `session=${cookieToken}`;
  }

  try {
    const response = await fetch(checkUrl, {
      headers,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith(SYSTEM_DASHBOARD_API_PREFIX);
  const token = getSessionToken(request);

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const allowed = await isAdminRequest(request);
  if (!allowed) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/system-dashboard/:path*", "/api/system-dashboard/:path*"],
};
