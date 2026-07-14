import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

type ComplianceCheckListRow = {
  id: number | string;
  company_name: string;
  website: string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return jsonResponse({ items: [], total: 0 });
      }

      const result = (await humanReviewRepository.getComplianceCheckAll({
        ...scope,
      })) as {
        rows: ComplianceCheckListRow[];
        total: number;
      };

      return jsonResponse({
        items: result.rows.map((row) => ({
          id: String(row.id),
          company_name: row.company_name,
          website: row.website,
        })),
        total: result.total,
      });
    } catch (error) {
      console.error("[GET /api/human-review/compliance-check]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
