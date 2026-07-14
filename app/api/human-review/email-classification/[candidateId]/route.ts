import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import humanReviewRepository from "@/server/repositories/humanReviewRepository.js";

type RouteContext = {
  params: Promise<{ candidateId: string }>;
};

type EmailClassificationDetailRow = {
  id: number | string;
  company_name: string;
  website: string | null;
  email: string;
  confidence_score: number | string | null;
  from_context: string | null;
  from_url: string | null;
  reason: string | null;
  likely_job_title: string | null;
  likely_contact_first_name: string | null;
  likely_contact_last_name: string | null;
  contact_role: string | null;
};

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Email classification record not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const rows = (await humanReviewRepository.getEmailClassificationDetail({
        ...scope,
        candidate_id: candidateId,
      })) as EmailClassificationDetailRow[];

      if (!rows.length) {
        return errorResponse("Email classification record not found", 404);
      }

      const first = rows[0];

      return jsonResponse({
        id: String(first.id),
        company_name: first.company_name,
        website: first.website,
        emails: rows.map((row) => ({
          email: row.email,
          confidence_score:
            row.confidence_score === null || row.confidence_score === undefined
              ? null
              : Number(row.confidence_score),
          from_context: row.from_context,
          from_url: row.from_url,
          reason: row.reason ?? "",
          likely_job_title: row.likely_job_title,
          likely_contact_first_name: row.likely_contact_first_name,
          likely_contact_last_name: row.likely_contact_last_name,
          contact_role: row.contact_role,
        })),
      });
    } catch (error) {
      console.error(
        "[GET /api/human-review/email-classification/[candidateId]]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
