"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import {
  AuthButton,
  AuthField,
  AuthShell,
} from "@/components/auth/AuthShell";
import { useUser } from "@/components/providers/UserProvider";
import { mapAuthCodeToMessage } from "@/lib/auth/mapAuthCodeToMessage";
import {
  GOOGLE_SIGN_IN_FORGOT_PASSWORD_NOTE,
  GOOGLE_SIGN_IN_RESET_SUCCESS_NOTE,
} from "@/lib/auth/signInMethods";

type FirebaseAuthError = {
  code?: string;
};

const RESET_EMAIL_SENT_MESSAGE =
  "If an account exists for this email, we sent a password reset link. Check your inbox and spam folder.";

export function ForgotPasswordForm() {
  const { requestPasswordReset } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required");
      setIsSubmitting(false);
      return;
    }

    try {
      await requestPasswordReset(trimmedEmail);
      setSubmitted(true);
    } catch (err) {
      const code = (err as FirebaseAuthError).code ?? "";
      setError(mapAuthCodeToMessage(code));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="Password reset link sent"
        showBackToLanding
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 px-4 py-4">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-800" />
            <div className="space-y-2 text-sm leading-relaxed text-teal-900">
              <p>{RESET_EMAIL_SENT_MESSAGE}</p>
              <p>{GOOGLE_SIGN_IN_RESET_SUCCESS_NOTE}</p>
            </div>
          </div>

          <AuthButton type="button" onClick={() => setSubmitted(false)}>
            Send another link
          </AuthButton>

          <p className="text-center text-sm text-zinc-500">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-medium text-teal-800 hover:text-teal-900"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new password"
      showBackToLanding
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-relaxed text-zinc-600">
          {GOOGLE_SIGN_IN_FORGOT_PASSWORD_NOTE}
        </p>

        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <AuthButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </AuthButton>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link href="/login" className="font-medium text-teal-800 hover:text-teal-900">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
