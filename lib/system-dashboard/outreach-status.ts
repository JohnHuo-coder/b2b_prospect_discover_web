export type OutreachUiStatus =
  | "succeed"
  | "failed"
  | "require_review"
  | "pending"
  | "rejected";

export type OutreachUiStatusFilter = "all" | OutreachUiStatus;

export type OutreachReviewAction = "keep" | "discard";

export function mapOutreachDbStatus(status: string): OutreachUiStatus {
  const normalized = status.trim().toLowerCase();

  if (normalized === "failed") return "failed";
  if (normalized === "pending") return "pending";
  if (normalized === "review_required" || normalized === "require_review") {
    return "require_review";
  }
  if (normalized === "rejected" || normalized === "human_rejected") {
    return "rejected";
  }
  if (normalized === "success" || normalized === "succeed") return "succeed";

  return "require_review";
}

export function mapOutreachFilterToDb(
  status: OutreachUiStatusFilter
): string | undefined {
  if (status === "all") return undefined;
  if (status === "succeed") return "success";
  if (status === "require_review") return "review_required";
  if (status === "pending") return "pending";
  if (status === "rejected") return "rejected";
  return status;
}

export function shouldShowComplianceReview(
  finalStage: string,
  status: string
): boolean {
  const normalizedStage = finalStage.trim().toLowerCase();
  const normalizedStatus = mapOutreachDbStatus(status);

  return (
    normalizedStage === "compliance_check" && normalizedStatus === "require_review"
  );
}

export function shouldShowHumanApprovedTag(
  finalStatus: string,
  humanReviewStatus: string | null | undefined
): boolean {
  const normalizedFinal = finalStatus.trim().toLowerCase();
  const isTerminalAfterReview =
    normalizedFinal === "failed" ||
    normalizedFinal === "success" ||
    normalizedFinal === "succeed";

  return (
    isTerminalAfterReview &&
    humanReviewStatus?.trim().toLowerCase() === "approved"
  );
}

export function safeSummaryCount(value: unknown): number {
  const count = Number(value);
  return Number.isFinite(count) ? count : 0;
}
