import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { handleComplianceCheckDecisionPatch } from "@/lib/api/compliance-check-decision-handler";
import {
  getConfigScope,
  requireBusinessAffiliation,
  type DbUserWithConfig,
} from "@/lib/api/server-config-scope";
import {
  mapOutreachDbStatus,
  shouldShowHumanApprovedTag,
} from "@/lib/system-dashboard/outreach-status";
import systemDashboardRepository from "@/server/repositories/systemDashboardRepository.js";

type RouteContext = {
  params: Promise<{ candidateId: string }>;
};

type OutreachStatusInfo = {
  company_name: string;
  website: string | null;
  status: string;
  final_stage: string | null;
  reason: string | null;
  human_review_status: string | null;
  modified: boolean | null;
  analytic_status: string | null;
  edit_severity: string | null;
};

type OutreachEmailRow = {
  email: string;
  outreach_email: string | null;
};

type OutreachNeedReviewEmail = {
  reason: string | null;
  issues: unknown;
  email_text: string | null;
  email_text_type: string | null;
};

function mapOutreachStatus(status: string) {
  return mapOutreachDbStatus(status);
}

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Candidate not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      const result = (await systemDashboardRepository.getOutreachStatusDetail({
        ...scope,
        candidate_id: candidateId,
      })) as {
        status_info: OutreachStatusInfo;
        emails: OutreachEmailRow[];
        need_review_emails: OutreachNeedReviewEmail | null;
      } | null;

      if (!result) {
        return errorResponse("Candidate not found", 404);
      }

      const info = result.status_info;

      return jsonResponse({
        id: candidateId,
        company_name: info.company_name,
        website: info.website,
        status: mapOutreachStatus(info.status),
        human_approved_tag: shouldShowHumanApprovedTag(
          info.status,
          info.human_review_status
        ),
        human_review_modified: info.modified ?? null,
        human_review_analytic_status: info.analytic_status ?? null,
        human_review_edit_severity: info.edit_severity ?? null,
        final_stage: info.final_stage ?? "",
        reason: info.reason ?? "",
        emails: (result.emails ?? []).map((row) => ({
          email: row.email,
          outreach_email: row.outreach_email,
        })),
        need_review_email: result.need_review_emails
          ? {
              reason: result.need_review_emails.reason ?? "",
              issues: result.need_review_emails.issues ?? [],
              email_text: result.need_review_emails.email_text ?? "",
              email_text_type: result.need_review_emails.email_text_type ?? "",
            }
          : null,
      });
    } catch (error) {
      console.error("[GET /api/system-dashboard/outreach/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);

export const PATCH = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUserWithConfig) => {
    try {
      const affiliationError = requireBusinessAffiliation(user);
      if (affiliationError) {
        return affiliationError;
      }

      const scope = getConfigScope(user);
      if (!scope) {
        return errorResponse("Candidate not found", 404);
      }

      const { candidateId } = await context.params;

      if (!candidateId) {
        return errorResponse("Candidate id is required", 400);
      }

      return handleComplianceCheckDecisionPatch(
        request,
        candidateId,
        scope.business_id,
        scope.version
      );
    } catch (error) {
      console.error("[PATCH /api/system-dashboard/outreach/[candidateId]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
