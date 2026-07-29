import type { User } from "firebase/auth";

export const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
  "Please verify your email before signing in. Check your inbox for the verification link.";

export const EMAIL_VERIFICATION_SENT_MESSAGE =
  "Verification email sent. Check your inbox and spam folder.";

export function requiresEmailVerification(
  user: Pick<User, "emailVerified" | "providerData">
): boolean {
  if (user.emailVerified) return false;
  return user.providerData.some((provider) => provider.providerId === "password");
}

export function isPasswordSignInProvider(
  signInProvider: string | undefined
): boolean {
  return signInProvider === "password";
}
