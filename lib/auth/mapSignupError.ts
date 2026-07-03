import { mapFirebaseAdminError } from "@/lib/auth/mapFirebaseAdminError";

type CodedError = Error & { code?: string };

export function mapSignupError(error: unknown): {
  message: string;
  status: number;
} {
  const err = error as CodedError;

  if (err.code === "23505" || err.code === "ER_DUP_ENTRY") {
    return { message: "Email already in use", status: 400 };
  }

  if (err.code === "ENOTFOUND" || err.code === "ECONNREFUSED") {
    return {
      message:
        "Database connection failed. Check DATABASE_URL in .env (Supabase project may be paused or the host is wrong).",
      status: 503,
    };
  }

  const firebase = mapFirebaseAdminError(err.code);
  if (firebase.status !== 500) {
    return firebase;
  }

  if (process.env.NODE_ENV === "development" && err.message) {
    return { message: err.message, status: 500 };
  }

  return { message: "Internal server error", status: 500 };
}
