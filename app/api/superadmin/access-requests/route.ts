import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withAdmin } from "@/lib/api/middleware/requireAdminMiddleware.js";
import requestRepository from "@/server/repositories/requestRepository.js";

export const GET = withAuth(
  withAdmin(async () => {
    try {
      const requests = await requestRepository.listAccessRequests();
      return jsonResponse({ requests });
    } catch (error) {
      console.error("[GET /api/superadmin/access-requests]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
