"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  Mail,
  Megaphone,
  ScanSearch,
  Search,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { getPostAuthDestination } from "@/lib/auth/accessRouting";
import { isUserApproved } from "@/lib/auth/isUserApproved";
import { LandingAtmosphere } from "@/components/landing/LandingAtmosphere";
import { LandingFeatureVisual } from "@/components/landing/LandingFeatureVisual";
import { LandingHeroVisual } from "@/components/landing/LandingHeroVisual";
import { LandingReveal } from "@/components/landing/LandingReveal";

const GUIDED_WALKTHROUGH_URL =
  "https://app.supademo.com/demo/cms81ew4y01kdqm68samg07zi?utm_source=link";
const CASE_STUDY_URL =
  "https://app.supademo.com/demo/cms8856pv066tqm6877vaav0a?utm_source=link";

const iconClass = "h-5 w-5";
const iconStroke = 1.5;

const heroHighlights = [
  {
    icon: Search,
    label: "Discovery runs",
    value: "Evidence-Based Evaluation",
    iconBoxClassName: "bg-teal-100 text-teal-800",
  },
  {
    icon: BarChart3,
    label: "Lead scoring",
    value: "Requirement-by-Requirement Scoring",
    iconBoxClassName: "bg-blue-100 text-blue-700",
  },
  {
    icon: Mail,
    label: "Outreach",
    value: "Personalized Outreach",
    iconBoxClassName: "bg-amber-100 text-amber-700",
  },
] as const;

const spotlightFeatures = [
  {
    icon: Settings2,
    label: "Configure once",
    title: "Define your partnership strategy.",
    description:
      "Describe your business, partnership intent, and evaluation requirements once. Every discovery run follows the same strategy.",
    visual: "config" as const,
  },
  {
    icon: Search,
    label: "Discover on demand",
    title: "AI finds companies and explains every recommendation.",
    description:
      "AI collects evidence, evaluates each requirement, and returns a score, reasoning, and supporting facts.",
    visual: "discovery" as const,
    reverse: true,
  },
  {
    icon: Mail,
    label: "Review & outreach",
    title: "Review contacts and personalized outreach.",
    description:
      "Collect decision-maker contact emails, then generate personalized outreach from company evidence and your collaboration intent—not generic templates.",
    visual: "outreach" as const,
  },
  {
    icon: LayoutDashboard,
    label: "Track pipeline",
    title: "Manage every partnership opportunity in one place.",
    description:
      "The dashboard shows every evaluated candidate with key details and status. Filter by pipeline stage, review status summary counts, monitor running jobs and daily quota, and start discovery in one click.",
    visual: "dashboard" as const,
    reverse: true,
  },
];

const bentoItems = [
  {
    icon: ScanSearch,
    title: "System dashboard",
    description:
      "Give technical staff a workflow health view across discovery, scoring, contact, outreach, usage, and API errors.",
    span: "lg:col-span-1",
  },
  {
    icon: ShieldCheck,
    title: "Admin",
    description:
      "Business owners review and approve members requesting access to the workspace.",
    span: "lg:col-span-1",
  },
  {
    icon: ClipboardCheck,
    title: "Compliance review",
    description:
      "Flagged outreach routes through review before anything sends.",
    span: "lg:col-span-1",
  },
];

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:translate-y-px"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 active:translate-y-px"
    >
      {children}
    </Link>
  );
}

function ExternalSecondaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 active:translate-y-px"
    >
      {children}
    </a>
  );
}

function ExternalPrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 rounded-xl bg-teal-800 px-8 py-4 text-base font-medium text-white transition hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 active:translate-y-px md:px-10 md:text-lg"
    >
      {children}
    </a>
  );
}

export function LandingPage() {
  const { user, isLoading } = useUser();
  const isSignedIn = Boolean(user);
  const signedInHref = user
    ? getPostAuthDestination({
        emailVerified: user.emailVerified,
        approved: user.approved,
        providerData: user.providerData,
      })
    : "/login";

  const signedInLabel = isUserApproved(user)
    ? "Go to Dashboard"
    : "View application status";

  return (
    <div className="relative min-h-screen scroll-smooth bg-zinc-50 text-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-zinc-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-900 text-teal-50">
              <Megaphone className="h-[18px] w-[18px]" strokeWidth={iconStroke} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              Prospect Discover
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {!isLoading && isSignedIn ? (
              <PrimaryButton href={signedInHref}>
                {signedInLabel}
                <ArrowRight className="h-4 w-4" strokeWidth={iconStroke} />
              </PrimaryButton>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
                >
                  Log in
                </Link>
                <PrimaryButton href="/register">
                  Apply for access
                  <ArrowRight className="h-4 w-4" strokeWidth={iconStroke} />
                </PrimaryButton>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        <section className="relative overflow-hidden border-b border-zinc-200/80">
          <LandingAtmosphere variant="hero" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-14 md:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] md:items-center md:gap-10 md:pb-20 md:pt-16 lg:gap-14 lg:pb-24 lg:pt-20">
            <LandingReveal>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-teal-800">
                B2B partnership prospecting
              </p>
              <h1 className="mt-4 max-w-xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-zinc-950 md:text-[2.75rem] lg:text-5xl">
                Find partners that fit.
                <span className="mt-1 block text-zinc-600">
                  Reach them with proof.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-zinc-600 md:text-[17px]">
                Define your partnership requirements, let AI collect supporting evidence, evaluate every candidate transparently, and generate personalized outreach ready to send.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {isSignedIn ? (
                  <PrimaryButton href={signedInHref}>
                    {isUserApproved(user) ? "Open Dashboard" : signedInLabel}
                    <ArrowRight
                      className="h-4 w-4"
                      strokeWidth={iconStroke}
                    />
                  </PrimaryButton>
                ) : (
                  <>
                    <PrimaryButton href="/register">
                      Apply for access
                      <ArrowRight
                        className="h-4 w-4"
                        strokeWidth={iconStroke}
                      />
                    </PrimaryButton>
                    <SecondaryButton href="/login">Log in</SecondaryButton>
                  </>
                )}
                <ExternalSecondaryButton href={GUIDED_WALKTHROUGH_URL}>
                  Guided walkthrough
                </ExternalSecondaryButton>
                <ExternalSecondaryButton href={CASE_STUDY_URL}>
                  View case study
                </ExternalSecondaryButton>
              </div>
            </LandingReveal>

            <LandingReveal delay={0.08} className="relative w-full min-w-0 md:justify-self-end">
              <LandingHeroVisual />
            </LandingReveal>
          </div>

          <div className="relative mx-auto max-w-6xl border-t border-zinc-200/80 px-6 py-10 md:py-12">
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
              {heroHighlights.map((item, index) => {
                const Icon = item.icon;

                return (
                  <LandingReveal key={item.label} delay={index * 0.05}>
                    <article className="group relative h-full overflow-hidden rounded-xl border border-zinc-200/90 bg-white/90 p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
                      <div
                        aria-hidden
                        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-teal-800/[0.04] to-transparent opacity-0 transition group-hover:opacity-100"
                      />
                      <div className="relative flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconBoxClassName}`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={iconStroke} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400">
                            {item.label}
                          </p>
                          <p className="mt-1.5 text-sm font-semibold leading-snug text-zinc-950">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </article>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <LandingAtmosphere variant="section" />
          <LandingReveal className="relative max-w-2xl">
            <h2 className="text-balance text-3xl font-semibold tracking-[-0.02em] text-zinc-950 md:text-[2rem]">
              Built for teams that outgrew spreadsheets
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-600">
              Configure once, run discovery when you need it, and work leads
              through a structured pipeline with human review where it matters.
            </p>
          </LandingReveal>

          <div className="mt-16 space-y-20 md:space-y-28">
            {spotlightFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isReverse = feature.reverse;

              return (
                <LandingReveal key={feature.title} delay={index * 0.04}>
                  <article
                    className={`grid items-center gap-10 md:grid-cols-2 md:gap-14 ${
                      isReverse ? "md:[&>*:first-child]:order-2" : ""
                    }`}
                  >
                    <div className={isReverse ? "md:pl-4" : "md:pr-4"}>
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-teal-800">
                        {feature.label}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
                        {feature.title}
                      </h3>
                      <p className="mt-3 max-w-md text-pretty text-sm leading-relaxed text-zinc-600 md:text-[15px]">
                        {feature.description}
                      </p>
                    </div>
                    <LandingFeatureVisual variant={feature.visual} icon={Icon} />
                  </article>
                </LandingReveal>
              );
            })}
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <LandingReveal className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                Everything else in the product
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 md:text-base">
                Workflow visibility, member access control, and compliance review
                for the teams running your pipeline.
              </p>
            </LandingReveal>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bentoItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <LandingReveal
                    key={item.title}
                    delay={index * 0.05}
                    className={item.span}
                  >
                    <article className="flex h-full flex-col justify-between rounded-2xl bg-zinc-50 p-6 md:p-7">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-900/8 text-teal-900">
                        <Icon className={iconClass} strokeWidth={iconStroke} />
                      </div>
                      <div className="mt-8">
                        <h3 className="text-base font-semibold text-zinc-950">
                          {item.title}
                        </h3>
                        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-600">
                          {item.description}
                        </p>
                      </div>
                    </article>
                  </LandingReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
          <LandingAtmosphere variant="section" />
          <LandingReveal>
            <div className="relative mx-auto max-w-2xl rounded-2xl border border-zinc-200 bg-white px-8 py-12 text-center shadow-[0_20px_50px_-30px_rgba(24,24,27,0.12)] md:px-12 md:py-14">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-teal-800">
                Product tour
              </p>
              <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                See Prospect Discover in action
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-zinc-600 md:text-base">
                Walk through configuration, evidence-based evaluation, personalized
                outreach, and the partnership dashboard step by step—without signing up
                first.
              </p>
              <div className="mt-8 flex justify-center">
                <ExternalPrimaryButton href={GUIDED_WALKTHROUGH_URL}>
                  Start guided walkthrough
                  <ArrowRight className="h-5 w-5" strokeWidth={iconStroke} />
                </ExternalPrimaryButton>
              </div>
            </div>
          </LandingReveal>
        </section>

        <section className="relative overflow-hidden border-t border-zinc-200 bg-white">
          <LandingAtmosphere variant="section" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-24">
            <LandingReveal>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/90 px-8 py-10 shadow-[0_20px_50px_-30px_rgba(24,24,27,0.15)] backdrop-blur-sm md:flex md:items-end md:justify-between md:gap-10 md:px-12 md:py-12">
                <div className="max-w-xl">
                  <h2 className="text-balance text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl">
                    Ready to discover your next partners?
                  </h2>
                  <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-600 md:text-base">
                    Join your company workspace, configure discovery criteria,
                    and start finding qualified B2B prospects.
                  </p>
                </div>
                <div className="mt-8 shrink-0 md:mt-0">
                  {isSignedIn ? (
                    <PrimaryButton href={signedInHref}>
                      {signedInLabel}
                      <ArrowRight
                        className="h-4 w-4"
                        strokeWidth={iconStroke}
                      />
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton href="/register">
                      Apply for access
                      <ArrowRight
                        className="h-4 w-4"
                        strokeWidth={iconStroke}
                      />
                    </PrimaryButton>
                  )}
                </div>
              </div>
            </LandingReveal>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Prospect Discover — B2B partnership lead generation</p>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="transition hover:text-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            >
              Apply for access
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
