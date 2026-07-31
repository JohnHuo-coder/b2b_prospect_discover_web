import { mapAuthCodeToMessage } from "@/lib/auth/mapAuthCodeToMessage";

export const GOOGLE_SIGN_IN_CREDENTIAL_HINT =
  "If you registered with Google, password sign-in does not apply — use Continue with Google below.";

export const GOOGLE_SIGN_IN_FORGOT_PASSWORD_NOTE =
  "Registered with Google? Password reset does not apply — use Continue with Google on the sign-in page.";

export const GOOGLE_SIGN_IN_RESET_SUCCESS_NOTE =
  "Registered with Google? Ignore the reset email and sign in with Google instead.";

const CREDENTIAL_ERROR_CODES = new Set([
  "auth/invalid-credential",
  "auth/wrong-password",
  "auth/user-not-found",
]);

export function isCredentialSignInError(code: string): boolean {
  return CREDENTIAL_ERROR_CODES.has(code);
}

export function resolveLoginErrorMessage(code: string): string {
  return mapAuthCodeToMessage(code);
}
