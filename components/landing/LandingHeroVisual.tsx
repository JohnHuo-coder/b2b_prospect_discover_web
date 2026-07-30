"use client";

import { motion, useReducedMotion } from "motion/react";
import { BarChart3, Mail, Target } from "lucide-react";

const leads = [
  { company: "Northwind Logistics", score: 87, status: "Ready" },
  { company: "Harbor Analytics", score: 72, status: "Review" },
  { company: "Summit Retail Group", score: 91, status: "Ready" },
];

export function LandingHeroVisual() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative mx-auto w-full max-w-lg md:max-w-none md:pl-6 lg:-mr-4">
      <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full border border-teal-800/10 bg-teal-800/[0.04] md:block" />
      <div className="absolute -right-2 bottom-16 hidden h-16 w-16 rounded-2xl border border-zinc-200/80 bg-white/70 shadow-sm md:block" />

      <motion.div
        className="relative min-h-[420px] overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/80 shadow-[0_28px_60px_-24px_rgba(24,24,27,0.18)] backdrop-blur-sm"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
      >
        <div className="flex items-center gap-2 border-b border-zinc-200/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          </div>
          <div className="ml-2 flex-1 rounded-md bg-zinc-100 px-3 py-1.5">
            <p className="font-mono text-[10px] text-zinc-500">
              app.prospectdiscover.io/dashboard
            </p>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[140px_minmax(0,1fr)]">
          <aside className="hidden border-r border-zinc-200/80 bg-zinc-50/80 p-4 md:block">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
              Pipeline
            </p>
            <ul className="mt-4 space-y-2">
              {["Ready", "Sent", "Heard back", "Pending"].map((item, index) => (
                <li
                  key={item}
                  className={`rounded-md px-2.5 py-1.5 text-xs ${
                    index === 0
                      ? "bg-teal-900/10 font-medium text-teal-900"
                      : "text-zinc-500"
                  }`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          <div className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  Discovery run #184
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  47 leads above cutoff
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-900/10 text-teal-900">
                <Target className="h-4 w-4" strokeWidth={1.5} />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.company}
                  className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {lead.company}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{lead.status}</p>
                  </div>
                  <p className="font-mono text-sm font-semibold tabular-nums text-teal-800">
                    {lead.score}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2 text-zinc-500">
                  <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <p className="text-[11px]">Avg fit score</p>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-900">
                  78.4
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <p className="text-[11px]">Drafts ready</p>
                </div>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-zinc-900">
                  12
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-5 -left-2 max-w-[220px] rounded-xl border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm md:-left-8"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          Fit score
        </p>
        <p className="mt-1 text-sm font-semibold text-zinc-900">
          Requirement match: 91%
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
          <div className="h-full w-[91%] rounded-full bg-teal-800" />
        </div>
      </motion.div>
    </div>
  );
}
