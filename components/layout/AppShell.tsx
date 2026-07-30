"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { requiresEmailVerification } from "@/lib/auth/emailVerification";
import { isUserApproved } from "@/lib/auth/isUserApproved";
import { AppAtmosphere } from "@/components/layout/AppAtmosphere";
import { AppReveal } from "@/components/ui/AppReveal";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requiresEmailVerification(user)) {
      router.replace("/verify-email");
      return;
    }
    if (!isUserApproved(user)) {
      router.replace("/no-access");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-zinc-50">
        <AppAtmosphere variant="app" />
        <p className="relative z-10 text-sm text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!user || requiresEmailVerification(user) || !isUserApproved(user)) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-zinc-50">
      <AppAtmosphere variant="app" />
      <Sidebar />
      <main className="relative z-10 ml-64 h-screen overflow-y-auto">
        <AppReveal>{children}</AppReveal>
      </main>
    </div>
  );
}
