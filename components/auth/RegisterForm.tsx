"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken, sendEmailVerification } from "firebase/auth";
import {
  AuthButton,
  AuthDivider,
  AuthField,
  AuthShell,
  AuthTextArea,
  GoogleButton,
} from "@/components/auth/AuthShell";
import {
  businessSignup,
  memberSignup,
  submitAccessRequestWithToken,
} from "@/lib/api/auth-client";
import { getPostAuthDestination } from "@/lib/auth/accessRouting";
import { BUSINESS_NAME_IMMUTABLE_HINT } from "@/lib/constants/business-identity";
import {
  ACCESS_REQUEST_NOTE_HELP,
  ACCESS_REQUEST_NOTE_LABEL,
  ACCESS_REQUEST_NOTE_PLACEHOLDER,
  PENDING_ACCESS_NOTE_STORAGE_KEY,
} from "@/lib/constants/access-request";
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

const APPLICATION_SUBMITTED_MESSAGE =
  "Application submitted! Check your email to verify your account before signing in.";

export function RegisterForm() {
  const router = useRouter();
  const { googleAuth } = useUser();
  const [mode, setMode] = useState<RegisterMode>("business");

  const [businessName, setBusinessName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [developerNote, setDeveloperNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const trimmedNote = developerNote.trim();

    if (mode === "business" && !businessName.trim()) {
      setError("Business name is required");
      setIsSubmitting(false);
      return;
    }

    if (!trimmedNote) {
      setError("Note for website developer is required");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsSubmitting(false);
      return;
    }

    try {
      const optionalNames = {
        ...(firstName.trim() ? { first_name: firstName.trim() } : {}),
        ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
      };

      const response =
        mode === "business"
          ? await businessSignup({
              business_name: businessName.trim(),
              email,
              password,
              reason: trimmedNote,
              ...optionalNames,
            })
          : await memberSignup({
              email,
              password,
              reason: trimmedNote,
              ...optionalNames,
            });

      if (response?.customToken) {
        try {
          await signInWithCustomToken(auth, response.customToken);
          if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
          }
          router.push("/verify-email");
        } catch (loginError) {
          console.warn("Auto-login failed after account creation:", loginError);
          router.push(
            `/login?message=${encodeURIComponent(APPLICATION_SUBMITTED_MESSAGE)}`
          );
        }
      } else {
        router.push(
          `/login?message=${encodeURIComponent(APPLICATION_SUBMITTED_MESSAGE)}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");

    const trimmedNote = developerNote.trim();
    if (!trimmedNote) {
      setError("Note for website developer is required");
      return;
    }

    setIsGoogleLoading(true);

    try {
      sessionStorage.setItem(PENDING_ACCESS_NOTE_STORAGE_KEY, trimmedNote);
      const appUser = await googleAuth();
      if (!appUser) {
        return;
      }

      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        await submitAccessRequestWithToken(idToken, trimmedNote);
      }

      sessionStorage.removeItem(PENDING_ACCESS_NOTE_STORAGE_KEY);
      router.replace(getPostAuthDestination(appUser));
    } catch (err) {
      sessionStorage.removeItem(PENDING_ACCESS_NOTE_STORAGE_KEY);
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
      title="Apply for access"
      subtitle={
        mode === "business"
          ? "Apply with your business and owner account"
          : "Apply as a team member"
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
              autoComplete="organization"
              required
              hint={BUSINESS_NAME_IMMUTABLE_HINT}
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

        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="First Name (optional)"
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
          />
          <AuthField
            label="Last Name (optional)"
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
          />
        </div>

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
          autoComplete="new-password"
        />

        <AuthTextArea
          label={ACCESS_REQUEST_NOTE_LABEL}
          value={developerNote}
          onChange={setDeveloperNote}
          placeholder={ACCESS_REQUEST_NOTE_PLACEHOLDER}
          hint={ACCESS_REQUEST_NOTE_HELP}
          required
        />

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="pt-2">
          <AuthButton type="submit" disabled={isBusy}>
            {isSubmitting
              ? "Submitting application..."
              : mode === "business"
                ? "Apply as business"
                : "Apply as member"}
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
                ? "Applying with Google..."
                : "Apply with Google"
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
