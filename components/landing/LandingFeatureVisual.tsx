"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Mail,
  MapPin,
  Search,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

type FeatureVisualVariant = "config" | "discovery" | "outreach";

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

function ConfigVisual() {
  return (
    <VisualShell icon={Settings2} title="Business configuration">
      <div className="grid h-full gap-3 md:grid-cols-[120px_minmax(0,1fr)]">
        <aside className="hidden space-y-1.5 md:block">
          {["Profile", "Requirements", "Industries", "Outreach"].map(
            (item, index) => (
              <div
                key={item}
                className={`rounded-md px-2.5 py-2 text-xs ${
                  index === 1
                    ? "bg-teal-900/10 font-medium text-teal-900"
                    : "text-zinc-500"
                }`}
              >
                {item}
              </div>
            ),
          )}
        </aside>

        <div className="space-y-3 rounded-xl border border-zinc-200/80 bg-white/90 p-3 md:p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Partnership intent
            </p>
            <div className="mt-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
              Distribution partners in logistics & retail tech
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Target industries
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {["Logistics", "Retail SaaS", "Supply chain"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] text-zinc-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-zinc-600">
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
                <p className="text-[11px] font-medium">Fit score cutoff</p>
              </div>
              <p className="font-mono text-xs font-semibold tabular-nums text-teal-800">
                72
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full w-[72%] rounded-full bg-teal-800" />
            </div>
          </div>
        </div>
      </div>
    </VisualShell>
  );
}

function DiscoveryVisual() {
  const results = [
    { company: "Northwind Logistics", location: "Chicago, IL", score: 87 },
    { company: "Harbor Analytics", location: "Austin, TX", score: 72 },
    { company: "Summit Retail Group", location: "Denver, CO", score: 91 },
  ];

  return (
    <VisualShell icon={Search} title="Discovery run #184">
      <div className="flex h-full flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2.5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Status
            </p>
            <p className="text-xs font-medium text-zinc-900">
              Scoring 47 companies
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-600" />
            <span className="text-[11px] font-medium text-teal-800">Running</span>
          </div>
        </div>

        <div className="flex-1 space-y-2 rounded-xl border border-zinc-200/80 bg-white/90 p-3">
          <div className="flex items-center gap-2 text-zinc-500">
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            <p className="text-[11px] font-medium">Matched companies</p>
          </div>

          {results.map((result) => (
            <div
              key={result.company}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200/70 bg-zinc-50/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-900">
                  {result.company}
                </p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                  <MapPin className="h-3 w-3" strokeWidth={1.5} />
                  {result.location}
                </p>
              </div>
              <p className="font-mono text-xs font-semibold tabular-nums text-teal-800">
                {result.score}
              </p>
            </div>
          ))}
        </div>
      </div>
    </VisualShell>
  );
}

function OutreachVisual() {
  return (
    <VisualShell icon={Mail} title="Outreach workspace">
      <div className="grid h-full gap-3 md:grid-cols-[minmax(0,1fr)_110px]">
        <div className="rounded-xl border border-zinc-200/80 bg-white/90 p-3 md:p-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
            <Mail className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.5} />
            <p className="text-[11px] font-medium text-zinc-600">
              Draft via Gmail
            </p>
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Subject
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-900">
            Partnership opportunity — Northwind Logistics
          </p>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
            Preview
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
            Hi Morgan, we help logistics teams expand retail partnerships. Your
            recent expansion into the Midwest looks like a strong fit for our
            network...
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
            <ClipboardCheck className="h-3 w-3" strokeWidth={1.5} />
            Compliance review required
          </div>
        </div>

        <div className="hidden flex-col gap-2 md:flex">
          {[
            { label: "Ready", active: true },
            { label: "Sent", active: false },
            { label: "Heard back", active: false },
          ].map((stage) => (
            <div
              key={stage.label}
              className={`rounded-lg border px-2.5 py-2 text-center text-[10px] ${
                stage.active
                  ? "border-teal-800/20 bg-teal-900/10 font-medium text-teal-900"
                  : "border-zinc-200 bg-white/80 text-zinc-500"
              }`}
            >
              {stage.label}
            </div>
          ))}
          <div className="mt-auto flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-[10px] text-emerald-800">
            <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} />
            Contact enriched
          </div>
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
