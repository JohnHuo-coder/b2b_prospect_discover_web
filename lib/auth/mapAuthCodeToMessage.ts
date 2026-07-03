const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Invalid email address.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/popup-closed-by-user": "Sign in was cancelled.",
  "auth/cancelled-popup-request": "Sign in was cancelled.",
  "auth/popup-blocked": "Popup was blocked. Please allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
};

export function mapAuthCodeToMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? "Sign in failed. Please try again.";
}

export function isAuthCancellation(code: string): boolean {
  return code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request";
}
