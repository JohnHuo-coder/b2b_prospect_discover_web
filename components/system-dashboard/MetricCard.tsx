"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName = "text-teal-800",
  iconBoxClassName = "bg-teal-100",
  valueClassName = "text-zinc-950",
  progress,
  progressClassName = "bg-teal-500",
  large = false,
  onViewDetails,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: LucideIcon;
  iconClassName?: string;
  iconBoxClassName?: string;
  valueClassName?: string;
  progress?: number;
  progressClassName?: string;
  large?: boolean;
  onViewDetails?: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-600">{label}</p>
          <p
            className={`mt-2 font-bold ${large ? "text-4xl" : "text-3xl"} ${valueClassName}`}
          >
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
      </div>

      {progress !== undefined ? (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${progressClassName}`}
              style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
            />
          </div>
          {subtext ? (
            <p className="mt-2 text-xs text-zinc-500">{subtext}</p>
          ) : null}
        </div>
      ) : subtext ? (
        <p className="mt-3 text-sm text-zinc-500">{subtext}</p>
      ) : null}

      {onViewDetails ? (
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
        >
          View details
        </button>
      ) : null}
    </div>
  );
}

export function DataTableSection({
  title,
  subtitle,
  hint,
  children,
}: {
  title: string;
  subtitle?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-zinc-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>
          ) : null}
        </div>
        {hint ? <p className="text-xs text-zinc-400">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}
