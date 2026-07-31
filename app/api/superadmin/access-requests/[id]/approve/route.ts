import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withAdmin } from "@/lib/api/middleware/requireAdminMiddleware.js";
import requestRepository from "@/server/repositories/requestRepository.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseRequestId(rawId: string): number | null {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

export const POST = withAuth(
  withAdmin(async (_request: Request, context: RouteContext) => {
    try {
      const { id: rawId } = await context.params;
      const requestId = parseRequestId(rawId);

      if (requestId === null) {
        return errorResponse("Invalid request id", 400);
      }

      const approved = await requestRepository.approveAccessRequest(requestId);
      if (!approved) {
        return errorResponse("Access request not found or already reviewed", 404);
      }

      return jsonResponse({
        message: "Access request approved",
        request: approved,
      });
    } catch (error) {
      console.error(
        "[POST /api/superadmin/access-requests/[id]/approve]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
