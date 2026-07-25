"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

export function JoinCompanyRequiredBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-800">
      You need to join a company first.
    </div>
  );
}

export function useHumanReviewAccess() {
  const { user, isLoading } = useUser();
  const isPending = Boolean(user && (!user.role || user.role === "pending"));
  const isApproved = Boolean(user && user.role && user.role !== "pending");

  return { user, isLoading, isPending, isApproved };
}

export function HumanReviewBackLink({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <Link
        href="/human-review"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition hover:text-violet-700"
      >
        <ChevronLeft className="h-4 w-4" />
        Human Review
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function PendingReviewBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      {count} pending
    </span>
  );
}
