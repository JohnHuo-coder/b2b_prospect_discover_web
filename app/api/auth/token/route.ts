import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import {
  authLimiterConfig,
  checkRateLimit,
} from "@/lib/api/middleware/rateLimiter";
import "@/lib/firebase/firebase.js";
import userRepository from "@/server/repositories/userRepository.js";
import { getAuth } from "firebase-admin/auth";
import { parseDisplayName } from "@/lib/auth/parseDisplayName";

type DbError = Error & { code?: string };

const SESSION_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 3600,
  path: "/",
};

export async function POST(request: Request) {
  const rateLimited = checkRateLimit(request, authLimiterConfig);
  if (rateLimited) return rateLimited;

  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return errorResponse("No ID token provided");
    }

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { first_name, last_name } = parseDisplayName(decodedToken.name);

    const user = await userRepository.findOrCreate({
      uid: decodedToken.uid,
      email: decodedToken.email,
      first_name,
      last_name,
    });

    const response = NextResponse.json({ success: true, user });
    response.cookies.set("session", idToken, SESSION_COOKIE);
    return response;
  } catch (error) {
    console.error("Token handling error:", error);

    const err = error as DbError;
    if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
      return errorResponse("Email already in use");
    }

    return errorResponse("Internal server error", 500);
  }
}
