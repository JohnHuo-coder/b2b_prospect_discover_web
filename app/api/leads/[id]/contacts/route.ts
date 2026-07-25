import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { resolveRequestedConfigVersion } from "@/server/providers/shared/dashboardVersionHelpers.js";
import leadRepository from "@/server/repositories/leadRepository.js";

type DbUser = {
  business_id?: number | string | null;
  config_version?: number | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const DELETE = withAuth(
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

      const { searchParams } = new URL(request.url);
      const resolved = resolveRequestedConfigVersion(
        user,
        searchParams.get("version")
      );

      if (!resolved.ok) {
        if (resolved.reason === "no_config") {
          return errorResponse("Lead not found", 404);
        }
        return errorResponse("Invalid version", 400);
      }

      const version = resolved.version;

      const body = (await request.json()) as { email?: string };
      const email = typeof body.email === "string" ? body.email.trim() : "";

      if (!email) {
        return errorResponse("email is required", 400);
      }

      const result = await leadRepository.deleteLeadContact({
        id,
        business_id,
        version,
        email,
      });

      if (!result.affectedRows) {
        return errorResponse("Contact not found", 404);
      }

      return jsonResponse({ success: true });
    } catch (error) {
      console.error("[DELETE /api/leads/[id]/contacts]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
