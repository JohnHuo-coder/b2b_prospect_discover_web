"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  LayoutDashboard,
  List,
  Mail,
  Search,
  Settings2,
} from "lucide-react";

type FeatureVisualVariant = "config" | "discovery" | "outreach" | "dashboard";

type LandingFeatureVisualProps = {
  variant: FeatureVisualVariant;
  icon: LucideIcon;
};

function VisualShell({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 via-white to-teal-50/40 shadow-[0_20px_50px_-28px_rgba(24,24,27,0.2)]">
      <div className="absolute inset-0 opacity-40">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(24,24,27,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative flex h-full flex-col p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
              <Icon className="h-4 w-4" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-semibold text-zinc-900">{title}</p>
          </div>
          <span className="rounded-md bg-teal-900/10 px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-teal-800">
            Live preview
          </span>
        </div>

        <div className="mt-4 flex-1">{children}</div>
      </div>
    </div>
  );
}

function MiniConfigCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200/90 bg-white/95 shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
        <h3 className="text-[11px] font-semibold text-zinc-950">{title}</h3>
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </section>
  );
}

function ConfigVisual() {
  const collaborationIntent =
    "We are looking to identify software companies with complementary products that could become integration partners, allowing customers to automate workflows across both platforms.";

  const requirements = [
    "The company provides cloud-based business software.",
    "The company serves mid-market B2B customers with 50–500 employees.",
  ];

  return (
    <VisualShell icon={Settings2} title="Configuration">
      <div className="flex h-full flex-col gap-2.5">
        <MiniConfigCard icon={Building2} title="Business Identity">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
            Collaboration Intent
          </p>
          <div className="mt-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[10px] leading-relaxed text-zinc-700">
            {collaborationIntent}
          </div>
        </MiniConfigCard>

        <MiniConfigCard icon={List} title="Requirements">
          <div className="space-y-2">
            {requirements.map((requirement, index) => (
              <div key={requirement} className="flex items-start gap-2">
                <span className="w-3.5 shrink-0 pt-1.5 text-[10px] font-medium text-zinc-500">
                  {index + 1}.
                </span>
                <div className="min-h-[36px] flex-1 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[10px] leading-relaxed text-zinc-700">
                  {requirement}
                </div>
              </div>
            ))}
          </div>
        </MiniConfigCard>
      </div>
    </VisualShell>
  );
}

function RequirementScoreCard({
  name,
  score,
  maxScore,
  reason,
  facts,
}: {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
  facts: string[];
}) {
  const percent = Math.min(Math.max((score / maxScore) * 100, 0), 100);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <h4 className="text-[10px] font-semibold leading-snug text-zinc-950">
          {name}
        </h4>
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-emerald-600">
          {score}/{maxScore}
        </span>
      </div>

      <div className="mb-2 h-1 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[9px] leading-relaxed text-zinc-600">{reason}</p>

      <ul className="mt-1.5 space-y-1">
        {facts.map((fact) => (
          <li
            key={fact}
            className="flex items-start gap-1 text-[9px] leading-relaxed text-zinc-700"
          >
            <CheckCircle2 className="mt-0.5 h-2.5 w-2.5 shrink-0 text-teal-600" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DiscoveryVisual() {
  const requirements = [
    {
      name: "Provides cloud-based business software",
      score: 92,
      maxScore: 100,
      reason:
        "Northwind offers a SaaS platform for workflow automation with publicly documented API integrations for CRM and billing tools.",
      facts: [
        "Product pages describe a cloud-hosted platform with REST API access.",
        "Integrations listed for Salesforce, HubSpot, and Stripe.",
      ],
    },
    {
      name: "Serves mid-market B2B customers",
      score: 88,
      maxScore: 100,
      reason:
        "Case studies and pricing tiers target companies with 50–500 employees in professional services and operations teams.",
      facts: ["Customer stories highlight mid-market logistics and finance teams."],
    },
  ];

  return (
    <VisualShell icon={Search} title="Northwind Software">
      <div className="flex h-full flex-col gap-2">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Candidate
            </p>
            <p className="text-[11px] font-medium text-zinc-900">Ready for review</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Ready
          </span>
        </div>

        <div className="flex-1 space-y-2 overflow-hidden">
          {requirements.map((requirement) => (
            <RequirementScoreCard key={requirement.name} {...requirement} />
          ))}
        </div>
      </div>
    </VisualShell>
  );
}

function OutreachVisual() {
  const contactEmail = "alex.morgan@northwindsoftware.com";
  const outreachEmail = `Hi Alex,

I've been following Northwind Software's workflow automation platform and your documented integrations with Salesforce, HubSpot, and Stripe.

We provide API-first automation software for mid-market teams, and I think there is a strong fit for an integration partnership.

Would you be open to a brief conversation about co-marketing and a technical integration path?

Best regards,
Demo Team`;

  return (
    <VisualShell icon={Mail} title="Northwind Software">
      <div className="relative h-full min-h-[250px]">
        <section className="h-full rounded-lg border border-zinc-200 bg-white p-2.5">
          <p className="text-[10px] font-semibold text-zinc-950">Contact</p>

          <div className="mt-2 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <Mail className="h-3 w-3 shrink-0 text-teal-800" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-teal-800">{contactEmail}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                Verified
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              Ready
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                First Name
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-800">Alex</p>
            </div>
            <div>
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                Last Name
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-800">Morgan</p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                Job Title
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-800">VP of Partnerships</p>
            </div>
            <div className="col-span-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-400">
                LinkedIn
              </p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-teal-800">
                <ExternalLink className="h-2.5 w-2.5" strokeWidth={1.5} />
                View profile
              </p>
            </div>
          </div>
        </section>

        <div className="absolute inset-0 rounded-lg bg-zinc-950/10" aria-hidden />

        <div className="absolute bottom-2 left-3 right-3 z-10 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_16px_40px_-18px_rgba(24,24,27,0.35)]">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 px-2.5 py-2">
            <div>
              <p className="text-[10px] font-semibold text-zinc-950">Outreach Email</p>
              <p className="mt-0.5 text-[9px] text-zinc-500">To: {contactEmail}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-1.5 py-0.5 text-[9px] font-medium text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
              Ready
            </span>
          </div>

          <div className="max-h-[118px] overflow-hidden px-2.5 py-2">
            <p className="whitespace-pre-line text-[9px] leading-relaxed text-zinc-700">
              {outreachEmail}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-2.5 py-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-0.5 text-[8px] font-medium text-zinc-600">
              <Copy className="h-2.5 w-2.5" strokeWidth={1.5} />
              Copy
            </span>
            <div className="flex items-center gap-1">
              <span className="rounded-md border border-zinc-200 px-1.5 py-0.5 text-[8px] font-medium text-zinc-600">
                Cancel
              </span>
              <span className="rounded-md bg-teal-800/80 px-1.5 py-0.5 text-[8px] font-medium text-white">
                Save
              </span>
              <span className="rounded-md bg-teal-800 px-1.5 py-0.5 text-[8px] font-medium text-white">
                Send
              </span>
            </div>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

function DashboardVisual() {
  const summaryCards = [
    { label: "Ready", value: 8, valueClass: "text-teal-800", bgClass: "bg-teal-50" },
    { label: "Email Sent", value: 3, valueClass: "text-blue-600", bgClass: "bg-blue-50" },
    { label: "Heard Back", value: 2, valueClass: "text-emerald-600", bgClass: "bg-emerald-50" },
  ];

  const statusFilters = [
    { label: "All", active: false },
    { label: "Ready", active: true },
    { label: "Email Sent", active: false },
    { label: "Pending", active: false },
  ];

  const leads = [
    {
      id: "LD-1842",
      company: "Northwind Software",
      contact: "Alex Morgan",
      status: "Ready",
      statusClass: "bg-teal-50 text-teal-800",
    },
    {
      id: "LD-1840",
      company: "Summit Retail Group",
      contact: "Riley Chen",
      status: "Ready",
      statusClass: "bg-teal-50 text-teal-800",
    },
    {
      id: "LD-1839",
      company: "Harbor Analytics",
      contact: "Jamie Lee",
      status: "Email Sent",
      statusClass: "bg-blue-50 text-blue-700",
    },
    {
      id: "LD-1836",
      company: "IntegrateFlow",
      contact: "Sam Ortiz",
      status: "Heard Back",
      statusClass: "bg-emerald-50 text-emerald-700",
    },
    {
      id: "LD-1831",
      company: "CloudBridge Systems",
      contact: "Taylor Brooks",
      status: "Pending",
      statusClass: "bg-amber-50 text-amber-700",
    },
    {
      id: "LD-1828",
      company: "PixelOps",
      contact: "Jordan Kim",
      status: "Rejected",
      statusClass: "bg-zinc-100 text-zinc-600",
    },
  ];

  return (
    <VisualShell icon={LayoutDashboard} title="Dashboard">
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold text-zinc-950">All lead candidates</p>
            <p className="mt-0.5 text-[9px] text-zinc-500">
              12/50 prospects today · 1/2 running
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-teal-800 px-2 py-1 text-[9px] font-medium text-white">
            Start Prospect Discover
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-md border border-zinc-200 px-2 py-1.5 ${card.bgClass}`}
            >
              <p className="text-[8px] font-medium text-zinc-600">{card.label}</p>
              <p className={`mt-0.5 text-sm font-bold tabular-nums ${card.valueClass}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          {statusFilters.map((filter) => (
            <span
              key={filter.label}
              className={`rounded px-1.5 py-0.5 text-[8px] font-medium ${
                filter.active
                  ? "bg-teal-800 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600"
              }`}
            >
              {filter.label}
            </span>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-zinc-200 bg-white">
          <div className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.8fr)] border-b border-zinc-100 bg-zinc-50 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-zinc-400">
            <span>Company</span>
            <span>Contact</span>
            <span>Status</span>
          </div>
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="grid grid-cols-[minmax(0,0.7fr)_minmax(0,1fr)_minmax(0,0.8fr)] border-b border-zinc-50 px-2 py-1 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[9px] font-semibold text-zinc-950">
                  {lead.company}
                </p>
                <p className="text-[8px] text-zinc-400">{lead.id}</p>
              </div>
              <p className="truncate text-[9px] text-zinc-700">{lead.contact}</p>
              <span
                className={`inline-flex w-fit rounded-full px-1.5 py-0.5 text-[8px] font-medium ${lead.statusClass}`}
              >
                {lead.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </VisualShell>
  );
}

export function LandingFeatureVisual({
  variant,
  icon,
}: LandingFeatureVisualProps) {
  switch (variant) {
    case "config":
      return <ConfigVisual />;
    case "discovery":
      return <DiscoveryVisual />;
    case "outreach":
      return <OutreachVisual />;
    case "dashboard":
      return <DashboardVisual />;
    default:
      return (
        <VisualShell icon={icon} title="Product preview">
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/70 text-xs text-zinc-500">
            Preview unavailable
          </div>
        </VisualShell>
      );
  }
}
