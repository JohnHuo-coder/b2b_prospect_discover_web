import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type EmailClassificationListRow = {
  id: number | string;
  company_name: string;
  website: string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      const business_id = user.business_id;
      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      const result = (await humanReviewRepository.getEmailClassificationAll({
        business_id,
      })) as {
        rows: EmailClassificationListRow[];
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
      console.error("[GET /api/human-review/email-classification]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
