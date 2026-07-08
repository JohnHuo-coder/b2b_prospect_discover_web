"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  MailCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  fetchComplianceCheckQueue,
  fetchEmailClassificationQueue,
} from "@/lib/api/human-review-client";
import { PendingReviewBadge } from "./HumanReviewShared";

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
      className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${category.iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${category.iconClassName}`} />
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">{category.title}</h2>
        <PendingReviewBadge count={category.pendingCount} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {category.description}
      </p>
    </Link>
  );
}

export function HumanReviewContent() {
  const [compliancePendingCount, setCompliancePendingCount] = useState(0);
  const [emailClassificationPendingCount, setEmailClassificationPendingCount] =
    useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const [compliance, emailClassification] = await Promise.all([
          fetchComplianceCheckQueue(),
          fetchEmailClassificationQueue(),
        ]);
        if (cancelled) return;
        setCompliancePendingCount(compliance.total);
        setEmailClassificationPendingCount(emailClassification.total);
      } catch {
        if (!cancelled) {
          setCompliancePendingCount(0);
          setEmailClassificationPendingCount(0);
        }
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, []);

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
    {
      title: "Email Classification",
      description:
        "Review contacts with uncertain email classification — confirm role and inbox type.",
      href: "/human-review/email-classification",
      icon: MailCheck,
      iconBoxClassName: "bg-blue-100",
      iconClassName: "text-blue-600",
      pendingCount: emailClassificationPendingCount,
    },
  ];

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Human Review</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve lead candidates flagged for manual review
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {reviewCategories.map((category) => (
          <ReviewCategoryCard key={category.title} category={category} />
        ))}
      </div>
    </div>
  );
}
