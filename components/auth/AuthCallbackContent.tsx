"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/client";

export function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message] = useState("Completing authentication...");

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result) {
          // onAuthStateChanged syncs session via /api/auth/token and loads /api/auth/me
          router.replace("/dashboard");
          return;
        }

        if (searchParams.get("start") === "google") {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error("Auth callback error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed";
        router.replace(
          `/login?error=${encodeURIComponent(errorMessage)}`
        );
      }
    };

    void handleRedirectResult();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <p className="text-base text-gray-600">{message}</p>
    </div>
  );
}
