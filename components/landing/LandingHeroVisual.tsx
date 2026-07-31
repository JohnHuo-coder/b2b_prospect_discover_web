"use client";

import { motion, useReducedMotion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

const candidate = {
  company: "Northwind Software",
  status: "Ready",
  industry: "Business Software",
  employees: "201–500",
};

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
    facts: [
      "Customer stories highlight mid-market logistics and finance teams.",
    ],
  },
];

function RequirementMock({
  name,
  score,
  maxScore,
  reason,
  facts,
}: (typeof requirements)[number]) {
  const percent = Math.min(Math.max((score / maxScore) * 100, 0), 100);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white px-3.5 py-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-[11px] font-semibold leading-snug text-zinc-950">
          {name}
        </h3>
        <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-600">
          {score}/{maxScore}
        </span>
      </div>

      <div className="mb-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-[10px] leading-relaxed text-zinc-600">{reason}</p>

      <ul className="mt-2 space-y-1.5">
        {facts.map((fact) => (
          <li
            key={fact}
            className="flex items-start gap-1.5 text-[10px] leading-relaxed text-zinc-700"
          >
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-teal-600" />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LandingHeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative ml-auto w-full max-w-[340px] sm:max-w-[360px] md:max-w-[380px] lg:max-w-[400px]">
      <motion.div
        className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50/80 shadow-[0_20px_50px_-28px_rgba(24,24,27,0.14)] backdrop-blur-sm"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200/80 bg-white/90 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-zinc-100 px-3 py-1.5">
            <p className="font-mono text-[10px] text-zinc-500">
              app.prospectdiscover.io/leads/northwind-software
            </p>
          </div>
        </div>

        <div className="space-y-2.5 p-3.5 md:p-4">
          <header>
            <h2 className="text-base font-bold text-zinc-950">{candidate.company}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-800">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                {candidate.status}
              </span>
              <span className="text-[10px] text-zinc-500">Added Jul 30, 2026</span>
            </div>
          </header>

          <section className="rounded-lg border border-zinc-200 bg-white px-3.5 py-3">
            <h3 className="text-[11px] font-semibold text-zinc-950">Overview</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Industry
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-800">{candidate.industry}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                  Employee Count Range
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-800">{candidate.employees}</p>
              </div>
            </div>
          </section>

          <div className="space-y-2.5">
            {requirements.map((requirement) => (
              <RequirementMock key={requirement.name} {...requirement} />
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
