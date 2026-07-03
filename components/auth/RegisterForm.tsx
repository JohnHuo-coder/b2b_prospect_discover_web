"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthShell,
  GoogleButton,
} from "@/components/auth/AuthShell";
import { businessSignup, memberSignup } from "@/lib/api/auth-client";
import { auth } from "@/lib/firebase/client";
import { useUser } from "@/components/providers/UserProvider";
import {
  isAuthCancellation,
  mapAuthCodeToMessage,
} from "@/lib/auth/mapAuthCodeToMessage";

type RegisterMode = "business" | "member";

type FirebaseAuthError = {
  code?: string;
};

const ACCOUNT_CREATED_MESSAGE =
  "Account created successfully! Please check your email to verify your account.";

export function RegisterForm() {
  const router = useRouter();
  const { googleAuth } = useUser();
  const [mode, setMode] = useState<RegisterMode>("business");

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const response =
        mode === "business"
          ? await businessSignup({
              business_name: businessName,
              email,
              password,
            })
          : await memberSignup({ email, password });

      if (response?.customToken) {
        try {
          await signInWithCustomToken(auth, response.customToken);
          router.push("/dashboard");
        } catch (loginError) {
          console.warn("Auto-login failed after account creation:", loginError);
          router.push(
            `/login?message=${encodeURIComponent(ACCOUNT_CREATED_MESSAGE)}`
          );
        }
      } else {
        router.push(
          `/login?message=${encodeURIComponent(ACCOUNT_CREATED_MESSAGE)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const shouldNavigate = await googleAuth();
      if (shouldNavigate) {
        router.replace("/dashboard");
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

  const isBusy = isSubmitting || isGoogleLoading;

  return (
    <AuthShell
      title="Create an account"
      subtitle={
        mode === "business"
          ? "Register your business and owner account"
          : "Join as a team member"
      }
    >
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("business")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === "business"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Business
        </button>
        <button
          type="button"
          onClick={() => setMode("member")}
          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === "member"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Member
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "business" ? (
          <>
            <AuthField
              label="Business Name"
              value={businessName}
              onChange={setBusinessName}
              placeholder="Suvarnaveda Wellness"
              autoComplete="organization"
            />
            <AuthField
              label="Owner Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="owner@company.com"
              autoComplete="email"
            />
          </>
        ) : (
          <AuthField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
            autoComplete="email"
          />
        )}

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          autoComplete="new-password"
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <AuthButton type="submit" disabled={isBusy}>
            {isSubmitting
              ? "Creating account..."
              : mode === "business"
                ? "Create business account"
                : "Create member account"}
          </AuthButton>
        </div>
      </form>

      {mode === "member" ? (
        <>
          <AuthDivider />
          <GoogleButton
            onClick={handleGoogleSignUp}
            disabled={isBusy}
            label={
              isGoogleLoading
                ? "Signing up with Google..."
                : "Continue with Google"
            }
          />
        </>
      ) : null}

      <p className={`text-center text-sm text-gray-500 ${mode === "member" ? "mt-6" : "mt-4"}`}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
