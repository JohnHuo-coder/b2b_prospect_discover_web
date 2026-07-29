"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { AuthButton, AuthShell } from "@/components/auth/AuthShell";
import { EMAIL_VERIFICATION_SENT_MESSAGE } from "@/lib/auth/emailVerification";
import { mapAuthCodeToMessage } from "@/lib/auth/mapAuthCodeToMessage";
import { useUser } from "@/components/providers/UserProvider";

export function VerifyEmailContent() {
  const router = useRouter();
  const { user, isLoading, logout, resendVerificationEmail, confirmEmailVerified } =
    useUser();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.emailVerified) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  const handleResend = async () => {
    setError("");
    setMessage("");
    setIsResending(true);

    try {
      await resendVerificationEmail();
      setMessage(EMAIL_VERIFICATION_SENT_MESSAGE);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      setError(
        code
          ? mapAuthCodeToMessage(code)
          : err instanceof Error
            ? err.message
            : "Failed to send verification email. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerified = async () => {
    setError("");
    setMessage("");
    setIsChecking(true);

    try {
      const verified = await confirmEmailVerified();
      if (verified) {
        router.replace("/dashboard");
        return;
      }
      setError(
        "Email not verified yet. Open the link in your inbox, then click “I've verified my email” again."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not refresh verification status. Please try again."
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("Failed to sign out. Please try again.");
    }
  };

  if (isLoading || !user || user.emailVerified) {
    return (
      <AuthShell title="Verify your email" subtitle="Loading...">
        <p className="text-sm text-gray-500">Loading...</p>
      </AuthShell>
    );
  }

  const isBusy = isResending || isChecking;

  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a confirmation link to finish setting up your account"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-4">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-violet-900">
              Check your inbox
            </p>
            <p className="text-sm leading-relaxed text-violet-800">
              We sent a verification link to{" "}
              <span className="font-medium">{user.email}</span>. Open it to
              activate your account, then return here and continue.
            </p>
          </div>
        </div>

        {message ? (
          <p className="text-sm text-emerald-600" role="status">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="space-y-3">
          <AuthButton
            type="button"
            onClick={() => void handleCheckVerified()}
            disabled={isBusy}
          >
            {isChecking ? "Checking..." : "I've verified my email"}
          </AuthButton>

          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isBusy}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-500">
          Wrong account?{" "}
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="font-medium text-violet-600 hover:text-violet-700"
          >
            Sign out
          </button>{" "}
          or{" "}
          <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700">
            back to login
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
