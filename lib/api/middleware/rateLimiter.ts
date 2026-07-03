import { NextResponse } from "next/server";

type RateLimitConfig = {
  windowMs: number;
  max: number;
  prefix: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** In-memory rate limiter for Next.js route handlers (replaces express-rate-limit). */
export function checkRateLimit(
  request: Request,
  config: RateLimitConfig
): NextResponse | null {
  const key = `${config.prefix}:${getClientIp(request)}`;
  const now = Date.now();

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > config.max) {
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      { status: 429 }
    );
  }

  return null;
}

export const authLimiterConfig = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: "auth-token",
} as const;
