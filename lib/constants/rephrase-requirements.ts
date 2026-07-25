export const REPHRASE_TRY_AGAIN_SUFFIX =
  "Please try again later or contact your technical team.";

export function formatRephraseErrorMessage(reason?: string | null): string {
  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (trimmedReason) {
    return `${trimmedReason} ${REPHRASE_TRY_AGAIN_SUFFIX}`;
  }

  return `Rephrase failed. ${REPHRASE_TRY_AGAIN_SUFFIX}`;
}
