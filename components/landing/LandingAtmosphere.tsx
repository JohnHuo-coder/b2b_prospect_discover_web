"use client";

type LandingAtmosphereProps = {
  variant?: "hero" | "section";
};

export function LandingAtmosphere({ variant = "section" }: LandingAtmosphereProps) {
  const isHero = variant === "hero";

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(24,24,27,0.07) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 0%, black 20%, transparent 70%)",
        }}
      />

      <div
        className={`absolute rounded-full blur-3xl ${
          isHero
            ? "-right-24 top-8 h-[520px] w-[520px] bg-teal-400/20"
            : "right-0 top-0 h-72 w-72 bg-teal-400/10"
        }`}
      />
      <div
        className={`absolute rounded-full blur-3xl ${
          isHero
            ? "left-[10%] top-[40%] h-80 w-80 bg-zinc-300/30"
            : "-left-16 bottom-0 h-64 w-64 bg-zinc-300/20"
        }`}
      />

      {isHero ? (
        <>
          <div className="absolute right-[8%] top-[18%] h-px w-40 rotate-[24deg] bg-gradient-to-r from-transparent via-teal-700/20 to-transparent" />
          <div className="absolute right-[22%] top-[62%] h-px w-28 -rotate-12 bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />
          <svg
            className="absolute -right-6 top-[28%] h-48 w-48 text-teal-800/[0.06]"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="56" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="24" stroke="currentColor" strokeWidth="1" />
          </svg>
        </>
      ) : null}
    </div>
  );
}
