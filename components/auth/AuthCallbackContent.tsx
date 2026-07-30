"use client";

import { useEffect, useState } from "react";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase/client";
import { submitAccessRequestWithToken } from "@/lib/api/auth-client";
import { getPostAuthDestination } from "@/lib/auth/accessRouting";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { PENDING_ACCESS_NOTE_STORAGE_KEY } from "@/lib/constants/access-request";

async function syncSessionAndLoadUser(idToken: string) {
  await fetch(ENDPOINTS.AUTH_TOKEN, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  const response = await fetch(ENDPOINTS.AUTH_ME, {
    headers: { Authorization: `Bearer ${idToken}` },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as { approved?: boolean; emailVerified?: boolean };
}

export function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message] = useState("Completing authentication...");

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);

        if (result?.user) {
          const idToken = await result.user.getIdToken();
          const pendingNote = sessionStorage.getItem(
            PENDING_ACCESS_NOTE_STORAGE_KEY
          )?.trim();

          const backendUser = await syncSessionAndLoadUser(idToken);

          if (pendingNote) {
            await submitAccessRequestWithToken(idToken, pendingNote);
            sessionStorage.removeItem(PENDING_ACCESS_NOTE_STORAGE_KEY);
          }

          router.replace(
            backendUser
              ? getPostAuthDestination({
                  emailVerified: result.user.emailVerified,
                  approved: backendUser.approved,
                  providerData: result.user.providerData,
                })
              : "/no-access"
          );
          return;
        }

        if (searchParams.get("start") === "google") {
          await signInWithRedirect(auth, googleProvider);
          return;
        }

        router.replace("/login");
      } catch (error) {
        console.error("Auth callback error:", error);
        sessionStorage.removeItem(PENDING_ACCESS_NOTE_STORAGE_KEY);
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
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <p className="text-base text-zinc-600">{message}</p>
    </div>
  );
}
