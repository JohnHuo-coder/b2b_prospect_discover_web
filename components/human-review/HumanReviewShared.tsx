import Link from "next/link";
import { ChevronLeft } from "lucide-react";

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
