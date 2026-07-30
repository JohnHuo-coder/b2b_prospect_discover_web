"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ShieldCheck, type LucideIcon } from "lucide-react";
import { fetchComplianceCheckQueue } from "@/lib/api/human-review-client";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { ConfigVersionToolbar } from "@/components/ui/ConfigVersionToolbar";
import { useConfigVersion } from "@/components/providers/ConfigVersionProvider";
import {
  JoinCompanyRequiredBanner,
  PendingReviewBadge,
  useHumanReviewAccess,
} from "./HumanReviewShared";

type ReviewCategory = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  iconBoxClassName: string;
  pendingCount: number;
};

function ReviewCategoryCard({ category }: { category: ReviewCategory }) {
  const Icon = category.icon;

  return (
    <Link
      href={category.href}
      className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${category.iconClassName}`} />
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-zinc-950">{category.title}</h2>
        <PendingReviewBadge count={category.pendingCount} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {category.description}
      </p>
    </Link>
  );
}

export function HumanReviewContent() {
  const { selectedVersion } = useConfigVersion();
  const { isLoading: authLoading, isPending, isApproved } = useHumanReviewAccess();
  const [compliancePendingCount, setCompliancePendingCount] = useState(0);

  useEffect(() => {
    if (!isApproved) return;

    let cancelled = false;

    const loadCounts = async () => {
      try {
        const compliance = await fetchComplianceCheckQueue(selectedVersion);
        if (cancelled) return;
        setCompliancePendingCount(compliance.total);
      } catch {
        if (!cancelled) {
          setCompliancePendingCount(0);
        }
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [isApproved, selectedVersion]);

  if (authLoading) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="mt-3 h-4 w-72" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-950">Human Review</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Review and approve lead candidates flagged for manual review
          </p>
        </div>
        <JoinCompanyRequiredBanner />
      </div>
    );
  }

  const reviewCategories: ReviewCategory[] = [
    {
      title: "Compliance Check",
      description:
        "Review outreach emails flagged by compliance — approve or discard before sending.",
      href: "/human-review/compliance-check",
      icon: ShieldCheck,
      iconBoxClassName: "bg-amber-100",
      iconClassName: "text-amber-600",
      pendingCount: compliancePendingCount,
    },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950">Human Review</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review and approve lead candidates flagged for manual review
        </p>
        <ConfigVersionToolbar className="mt-5" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:max-w-xl">
        {reviewCategories.map((category) => (
          <ReviewCategoryCard key={category.title} category={category} />
        ))}
      </div>
    </div>
  );
}
