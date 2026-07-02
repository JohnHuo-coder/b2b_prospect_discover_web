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

type RegisterMode = "business" | "member";

export function RegisterForm() {
  const router = useRouter();
  const [mode, setMode] = useState<RegisterMode>("business");

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // TODO: connect businessSignup / memberSignup API
    router.push("/dashboard");
  };

  const handleGoogleSignUp = () => {
    // TODO: connect Google OAuth
    router.push("/dashboard");
  };

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

        <div className="pt-2">
          <AuthButton type="submit">
            {mode === "business" ? "Create business account" : "Create member account"}
          </AuthButton>
        </div>
      </form>

      {mode === "member" ? (
        <>
          <AuthDivider />
          <GoogleButton onClick={handleGoogleSignUp} />
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
