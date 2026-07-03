import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import { N8nError, triggerN8nWebhook } from "@/lib/services/n8n";

type DbUser = {
  business_id?: number | string | null;
};

function parseRequirementsInput(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return items.length > 0 ? items : null;
}

export type RephraseSuggestion = {
  clarified: string;
  reason?: string;
};

function parseSuggestionItem(item: unknown): RephraseSuggestion | null {
  if (typeof item !== "object" || item === null) return null;
  const record = item as Record<string, unknown>;
  const clarified =
    typeof record.clarified === "string" ? record.clarified.trim() : "";
  if (!clarified) return null;
  const reason = typeof record.reason === "string" ? record.reason.trim() : undefined;
  return { clarified, reason };
}

export function extractRephraseSuggestions(data: unknown): RephraseSuggestion[] | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    const suggestions = data
      .map(parseSuggestionItem)
      .filter((item): item is RephraseSuggestion => item !== null);
    return suggestions.length > 0 ? suggestions : null;
  }

  if (typeof data !== "object") return null;

  const record = data as Record<string, unknown>;

  for (const key of ["requirements", "requirementList", "rephrasedRequirements"]) {
    const parsed = extractRephraseSuggestions(record[key]);
    if (parsed) return parsed;
  }

  if (record.result) {
    return extractRephraseSuggestions(record.result);
  }

  if (record.data) {
    return extractRephraseSuggestions(record.data);
  }

  return null;
}

export function extractRephrasedRequirements(data: unknown): string[] | null {
  const suggestions = extractRephraseSuggestions(data);
  if (suggestions) {
    return suggestions.map((item) => item.clarified);
  }

  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  for (const key of ["requirements", "requirementList", "rephrasedRequirements"]) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    const items = value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    if (items.length > 0) return items;
  }

  return null;
}

export const POST = withAuth(
  withApproved(
    withOwner(async (request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const body = (await request.json()) as { requirements?: unknown };
        const requirements = parseRequirementsInput(body.requirements);

        if (!requirements) {
          return errorResponse("requirements must be a non-empty array", 400);
        }

        const result = await triggerN8nWebhook("rephrase-requirement", {
          business_id: user.business_id,
          requirements,
        });

        const suggestions = extractRephraseSuggestions(result);
        const rephrased = suggestions?.map((item) => item.clarified) ?? null;

        return jsonResponse({
          suggestions: suggestions ?? rephrased?.map((clarified) => ({ clarified })) ?? [],
        });
      } catch (error) {
        if (error instanceof N8nError) {
          console.error("[POST /api/business/config/requirements/rephrase]", error);
          return jsonResponse(
            { error: error.message, details: error.data },
            error.status
          );
        }

        console.error("[POST /api/business/config/requirements/rephrase]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
