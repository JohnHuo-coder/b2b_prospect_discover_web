"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  Mail,
  Megaphone,
  Search,
  Settings2,
  Sparkles,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";

const features = [
  {
    icon: Settings2,
    title: "Business configuration",
    description:
      "Define your company profile, partnership intent, target industries, search criteria, contact preferences, and outreach settings in one place.",
  },
  {
    icon: Search,
    title: "Automated prospect discovery",
    description:
      "Launch discovery runs that find companies matching your requirements, score them against your criteria, and surface qualified leads automatically.",
  },
  {
    icon: BarChart3,
    title: "Fit scoring & requirements",
    description:
      "Every lead is scored against your configured requirements with supporting facts, so your team can focus on the strongest opportunities first.",
  },
  {
    icon: Users,
    title: "Contact enrichment",
    description:
      "Discover decision-maker emails from verified sources and website contacts, with confidence indicators to guide outreach decisions.",
  },
  {
    icon: Mail,
    title: "Gmail-powered outreach",
    description:
      "Connect Gmail, review AI-drafted outreach emails, edit copy when needed, and send directly from the platform.",
  },
  {
    icon: ClipboardCheck,
    title: "Human review & compliance",
    description:
      "Flagged outreach goes through a compliance review workflow before sending, keeping messaging accurate and on-brand.",
  },
  {
    icon: Target,
    title: "Lead pipeline",
    description:
      "Track prospects from Ready through Sent, Heard Back, Pending, and Rejected — with full lead and contact detail views.",
  },
  {
    icon: Workflow,
    title: "Job monitoring",
    description:
      "See automation job status, queued runs, and daily discovery usage so teams know exactly what the system is doing.",
  },
];

const steps = [
  {
    step: "01",
    title: "Configure your search",
    description:
      "Set requirements, scoring thresholds, target partners, and outreach preferences for your business.",
  },
  {
    step: "02",
    title: "Run discovery",
    description:
      "Start a prospect discovery job. The pipeline finds companies, scores them, and collects contact information.",
  },
  {
    step: "03",
    title: "Review & reach out",
    description:
      "Open lead details, review contacts, pass compliance checks when needed, and send personalized outreach via Gmail.",
  },
  {
    step: "04",
    title: "Track responses",
    description:
      "Update lead status as conversations progress and keep your pipeline organized for follow-up.",
  },
];

export function LandingPage() {
  const { user, isLoading } = useUser();
  const isSignedIn = Boolean(user);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Prospect Discover
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {!isLoading && isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-gray-200 bg-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_40%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-sm font-medium text-violet-700">
                <Sparkles className="h-4 w-4" />
                B2B partnership prospecting, automated
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl md:leading-tight">
                Find the right partners.
                <span className="block text-violet-600">
                  Reach them with confidence.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
                Prospect Discover helps B2B teams identify companies that match
                their partnership criteria, enrich contacts, draft outreach, and
                manage the full lead lifecycle — from first discovery to heard
                back.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
                  >
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-violet-700"
                    >
                      Create account
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Log in
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Discovery runs", value: "Automated pipeline" },
                { label: "Lead scoring", value: "Requirement-based fit" },
                { label: "Outreach", value: "Gmail integration" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-white/80 px-5 py-4 shadow-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Everything you need to run outbound partnership discovery
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Built for teams that need more than a spreadsheet — configure once,
              run discovery on demand, and work leads through a structured
              pipeline with human review where it matters.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article
                  key={feature.title}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="border-y border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                How it works
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                From configuration to outreach, each step is designed to keep
                your team in control while automation handles the heavy lifting.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((item) => (
                <article
                  key={item.step}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                >
                  <p className="text-sm font-bold text-violet-600">{item.step}</p>
                  <h3 className="mt-3 text-lg font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-600 to-violet-700 px-8 py-10 text-white shadow-lg md:px-12 md:py-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to discover your next partners?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-violet-100">
              Join your company workspace, configure your discovery criteria, and
              start finding qualified B2B prospects today.
            </p>
            <div className="mt-8">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Prospect Discover — B2B partnership lead generation</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:text-violet-600">
              Log in
            </Link>
            <Link href="/register" className="transition hover:text-violet-600">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
