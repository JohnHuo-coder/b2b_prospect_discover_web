"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthShell,
  GoogleButton,
} from "@/components/auth/AuthShell";
import { useUser } from "@/components/providers/UserProvider";
import { getPostAuthDestination } from "@/lib/auth/accessRouting";
import {
  isAuthCancellation,
  mapAuthCodeToMessage,
} from "@/lib/auth/mapAuthCodeToMessage";

type FirebaseAuthError = {
  code?: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, googleAuth } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    () => searchParams.get("message")?.trim() ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const appUser = await login(email, password);
      router.replace(getPostAuthDestination(appUser));
    } catch (err) {
      const code = (err as FirebaseAuthError).code ?? "";
      setError(mapAuthCodeToMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const appUser = await googleAuth();
      if (appUser) {
        router.replace(getPostAuthDestination(appUser));
      }
    } catch (err) {
      const code = (err as FirebaseAuthError).code ?? "";
      if (!isAuthCancellation(code)) {
        setError(mapAuthCodeToMessage(code));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isBusy = isLoading || isGoogleLoading;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Lead Generation account"
      showBackToLanding
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        {notice ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <AuthButton type="submit" disabled={isBusy}>
            {isLoading ? "Signing in..." : "Sign in"}
          </AuthButton>
        </div>
      </form>

      <AuthDivider />

      <GoogleButton
        onClick={handleGoogleSignIn}
        disabled={isBusy}
        label={isGoogleLoading ? "Signing in with Google..." : "Continue with Google"}
      />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-teal-800 hover:text-teal-900">
          Apply for access
        </Link>
      </p>
    </AuthShell>
  );
}
