"use client";

type AppAtmosphereProps = {
  variant?: "app" | "auth";
};

export function AppAtmosphere({ variant = "app" }: AppAtmosphereProps) {
  const isAuth = variant === "auth";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(24,24,27,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: isAuth
            ? "radial-gradient(ellipse 90% 80% at 50% 20%, black 15%, transparent 75%)"
            : "radial-gradient(ellipse 70% 60% at 80% 0%, black 10%, transparent 65%)",
        }}
      />
      <div
        className={`absolute rounded-full blur-3xl ${
          isAuth
            ? "left-1/2 top-0 h-96 w-96 -translate-x-1/2 bg-teal-400/15"
            : "right-0 top-0 h-80 w-80 bg-teal-400/12"
        }`}
      />
      <div
        className={`absolute rounded-full blur-3xl ${
          isAuth
            ? "bottom-0 left-0 h-72 w-72 bg-zinc-300/25"
            : "bottom-0 left-1/4 h-64 w-64 bg-zinc-300/20"
        }`}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
