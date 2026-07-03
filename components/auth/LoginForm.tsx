"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthShell,
  GoogleButton,
} from "@/components/auth/AuthShell";
import { useUser } from "@/components/providers/UserProvider";
import { mapAuthCodeToMessage } from "@/lib/auth/mapAuthCodeToMessage";

type FirebaseAuthError = {
  code?: string;
};

export function LoginForm() {
  const router = useRouter();
  const { login } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      const code = (err as FirebaseAuthError).code ?? "";
      setError(mapAuthCodeToMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: connect Google OAuth via useUser().googleAuth()
    router.push("/dashboard");
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Lead Generation account"
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

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <AuthButton type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </AuthButton>
        </div>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogleSignIn} />

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-violet-600 hover:text-violet-700">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
