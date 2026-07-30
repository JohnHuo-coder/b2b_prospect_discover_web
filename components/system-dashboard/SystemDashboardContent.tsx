"use client";

import Link from "next/link";
import {
  AlertTriangle,
  AtSign,
  BarChart3,
  ChevronRight,
  Coins,
  ScanSearch,
  Send,
  type LucideIcon,
} from "lucide-react";
import { ConfigVersionToolbar } from "@/components/ui/ConfigVersionToolbar";

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
    iconBoxClassName: "bg-teal-100",
    iconClassName: "text-teal-800",
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
      "Estimated LLM cost — review business-level and candidate-level usage by config, stage, and task.",
    href: "/system-dashboard/usage",
    icon: Coins,
    iconBoxClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
  },
  {
    title: "API Errors",
    description:
      "External API failures — drill down by workflow, API name, and execution ID per config.",
    href: "/system-dashboard/api-errors",
    icon: AlertTriangle,
    iconBoxClassName: "bg-red-100",
    iconClassName: "text-red-600",
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
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" aria-hidden />
      </div>

      <h2 className="text-base font-semibold text-zinc-950">{stage.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {stage.description}
      </p>
    </>
  );

  if (stage.href) {
    return (
      <Link
        href={stage.href}
        className="block rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      {content}
    </article>
  );
}

export function SystemDashboardContent() {
  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-950">System Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Workflow stages for prospect discovery
        </p>
        <ConfigVersionToolbar className="mt-5" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {workflowStages.map((stage) => (
          <WorkflowStageCard key={stage.title} stage={stage} />
        ))}
      </div>
    </div>
  );
}
