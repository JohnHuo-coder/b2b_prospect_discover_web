import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";
import { normalizeContactCategories } from "@/lib/constants/contact-categories";

type DbUser = {
  business_id?: number | string | null;
};

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const normalized = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return normalized;
}

export const PATCH = withAuth(
  withApproved(
    withOwner(async (request: Request, _context: unknown, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const body = (await request.json()) as {
          contact_titles?: unknown;
          contact_categories?: unknown;
        };

        const contact_titles = normalizeStringArray(body.contact_titles);
        if (!contact_titles) {
          return errorResponse("contact_titles must be an array", 400);
        }

        const contact_categories = Array.isArray(body.contact_categories)
          ? normalizeContactCategories(
              body.contact_categories
                .map((item) => (typeof item === "string" ? item : ""))
                .filter(Boolean)
            )
          : [];

        const result = await businessRepository.upsertContactFilters({
          business_id: user.business_id,
          contact_titles,
          contact_categories,
        });
        return jsonResponse(result);
      } catch (error) {
        console.error("[PATCH /api/business/config/contact-filters]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
