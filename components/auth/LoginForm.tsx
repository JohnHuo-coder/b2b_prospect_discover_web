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

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // TODO: connect auth API
    router.push("/dashboard");
  };

  const handleGoogleSignIn = () => {
    // TODO: connect Google OAuth
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

        <div className="pt-2">
          <AuthButton type="submit">Sign in</AuthButton>
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
