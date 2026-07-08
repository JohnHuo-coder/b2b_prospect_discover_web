"use client";

import Link from "next/link";
import {
  AtSign,
  BarChart3,
  ChevronRight,
  Gauge,
  LayoutGrid,
  ScanSearch,
  Send,
  type LucideIcon,
} from "lucide-react";

type WorkflowStage = {
  title: string;
  description: string;
  href?: string;
  icon: LucideIcon;
  iconClassName: string;
  iconBoxClassName: string;
};

const workflowStages: WorkflowStage[] = [
  {
    title: "Overview",
    description:
      "Pipeline overview — stat cards, pipeline timeline, and recent candidate activity.",
    icon: LayoutGrid,
    iconBoxClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
  },
  {
    title: "Information Acquisition",
    description:
      "Website scraping results — track how many leads were successfully scraped and which sections were captured.",
    href: "/system-dashboard/information-acquisition",
    icon: ScanSearch,
    iconBoxClassName: "bg-teal-100",
    iconClassName: "text-teal-600",
  },
  {
    title: "Fitscore",
    description:
      "Confidence scoring overview — review auto-passed, auto-rejected, and leads flagged for human review.",
    href: "/system-dashboard/fitscore",
    icon: BarChart3,
    iconBoxClassName: "bg-violet-100",
    iconClassName: "text-violet-600",
  },
  {
    title: "Contact",
    description:
      "Email discovery and classification — see results from Apollo, Anymail Finder, and website scraping.",
    href: "/system-dashboard/contact",
    icon: AtSign,
    iconBoxClassName: "bg-blue-100",
    iconClassName: "text-blue-600",
  },
  {
    title: "Outreach",
    description:
      "Outreach email drafts and compliance checks — review and fix emails that failed compliance.",
    href: "/system-dashboard/outreach",
    icon: Send,
    iconBoxClassName: "bg-amber-100",
    iconClassName: "text-amber-600",
  },
  {
    title: "Usage",
    description:
      "Resource usage — monitor API calls, credits consumed, and prospect discover run history.",
    icon: Gauge,
    iconBoxClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
  },
];

function WorkflowStageCard({ stage }: { stage: WorkflowStage }) {
  const Icon = stage.icon;

  const content = (
    <>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${stage.iconBoxClassName}`}
        >
          <Icon className={`h-5 w-5 ${stage.iconClassName}`} />
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
      </div>

      <h2 className="text-base font-semibold text-gray-900">{stage.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        {stage.description}
      </p>
    </>
  );

  if (stage.href) {
    return (
      <Link
        href={stage.href}
        className="block rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-gray-300 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {content}
    </article>
  );
}

export function SystemDashboardContent() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Workflow stages for prospect discovery
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {workflowStages.map((stage) => (
          <WorkflowStageCard key={stage.title} stage={stage} />
        ))}
      </div>
    </div>
  );
}
