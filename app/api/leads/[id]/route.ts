import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import leadRepository from "@/server/repositories/leadRepository.js";

type DbUser = {
  business_id?: number | string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PATCH = withAuth(
  withApproved(async (request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { id } = await context.params;
      const business_id = user.business_id;

      if (!business_id) {
        return errorResponse("Business affiliation required", 400);
      }

      if (!id) {
        return errorResponse("Lead id is required", 400);
      }

      const body = (await request.json()) as { status?: string };
      const status = body.status?.trim();

      if (!status) {
        return errorResponse("status is required", 400);
      }

      const result = await leadRepository.updateLeadStatus({
        id,
        business_id,
        status,
      });

      if (!result.affectedRows) {
        return errorResponse("Lead not found", 404);
      }

      return jsonResponse({ success: true });
    } catch (error) {
      console.error("[PATCH /api/leads/[id]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);

export const GET = withAuth(
  withApproved(async (_request: Request, context: RouteContext, user: DbUser) => {
    try {
      const { id } = await context.params;

      if (!id) {
        return errorResponse("Lead id is required", 400);
      }

      const result = await leadRepository.getById({
        id,
        business_id: user.business_id ?? undefined,
      });

      if (!result) {
        return errorResponse("Lead not found", 404);
      }

      return jsonResponse(result);
    } catch (error) {
      console.error("[GET /api/leads/[id]]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
