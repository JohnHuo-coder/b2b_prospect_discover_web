export type ContactEmailSource = "apollo" | "anymail_finder" | "website";

export function isContactSuccessStatus(status: string | null | undefined): boolean {
  const normalized = String(status ?? "").trim().toLowerCase();
  return normalized === "success" || normalized === "succeed";
}

export function getContactEmailSource(
  status: string,
  apolloStatus: string | null | undefined,
  anymailFinderStatus: string | null | undefined
): ContactEmailSource | null {
  if (!isContactSuccessStatus(status)) return null;

  if (isContactSuccessStatus(apolloStatus)) return "apollo";
  if (isContactSuccessStatus(anymailFinderStatus)) return "anymail_finder";
  return "website";
}

export function getContactEmailSourceLabel(source: ContactEmailSource): string {
  if (source === "apollo") return "From Apollo";
  if (source === "anymail_finder") return "From Anymail Finder";
  return "From website";
}

export type ContactEmailSourceCardStats = {
  rate: number;
  found: number;
  total: number;
};

export type ContactEmailSourceBreakdown = {
  apollo: ContactEmailSourceCardStats;
  anymailFinder: ContactEmailSourceCardStats;
  emailFromWebsite: ContactEmailSourceCardStats;
};

function safeCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? Math.max(count, 0) : 0;
}

function computePercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function computeContactEmailSourceBreakdown(input: {
  totalInput: number;
  succeed: number;
  successApollo: number;
  successAnymail: number;
}): ContactEmailSourceBreakdown {
  const total = safeCount(input.totalInput);
  const succeed = safeCount(input.succeed);
  const apolloFound = safeCount(input.successApollo);
  const anymailFound = safeCount(input.successAnymail);
  const websiteFound = Math.max(succeed - apolloFound - anymailFound, 0);

  const anymailPool = Math.max(total - apolloFound, 0);
  const websitePool = Math.max(total - apolloFound - anymailFound, 0);

  return {
    apollo: {
      rate: computePercent(apolloFound, total),
      found: apolloFound,
      total,
    },
    anymailFinder: {
      rate: computePercent(anymailFound, anymailPool),
      found: anymailFound,
      total: anymailPool,
    },
    emailFromWebsite: {
      rate: computePercent(websiteFound, websitePool),
      found: websiteFound,
      total: websitePool,
    },
  };
}
