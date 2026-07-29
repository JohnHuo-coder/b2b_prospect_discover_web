"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { requiresEmailVerification } from "@/lib/auth/emailVerification";
import { isUserApproved } from "@/lib/auth/isUserApproved";
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user || requiresEmailVerification(user) || !isUserApproved(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
