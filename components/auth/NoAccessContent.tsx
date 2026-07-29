"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3 } from "lucide-react";
import { AuthButton, AuthShell } from "@/components/auth/AuthShell";
import { getPostAuthDestination } from "@/lib/auth/accessRouting";
import { isUserApproved } from "@/lib/auth/isUserApproved";
import { requiresEmailVerification } from "@/lib/auth/emailVerification";
import { useUser } from "@/components/providers/UserProvider";

export function NoAccessContent() {
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

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

    if (isUserApproved(user)) {
      router.replace(getPostAuthDestination(user));
    }
  }, [isLoading, user, router]);

  const handleSignOut = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch {
      // ignore
    }
  };

  if (isLoading || !user || requiresEmailVerification(user) || isUserApproved(user)) {
    return (
      <AuthShell title="Access pending" subtitle="Loading...">
        <p className="text-sm text-gray-500">Loading...</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Thanks for your interest!"
      subtitle="Your application is being reviewed"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="space-y-2 text-sm leading-relaxed text-amber-900">
            <p>
              Your account has been created, but access hasn&apos;t been approved
              yet.
            </p>
            <p>
              We&apos;ll notify you by email once your workspace is activated.
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          Signed in as{" "}
          <span className="font-medium text-gray-700">{user.email}</span>
        </p>

        <AuthButton type="button" onClick={() => void handleSignOut()}>
          Sign out
        </AuthButton>

        <p className="text-center text-sm text-gray-500">
          Already approved?{" "}
          <Link href="/login" className="font-medium text-violet-600 hover:text-violet-700">
            Sign in again
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
