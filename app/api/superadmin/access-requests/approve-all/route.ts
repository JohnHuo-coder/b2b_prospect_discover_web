import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withAdmin } from "@/lib/api/middleware/requireAdminMiddleware.js";
import requestRepository from "@/server/repositories/requestRepository.js";

export const POST = withAuth(
  withAdmin(async () => {
    try {
      const result = await requestRepository.approveAllActiveAccessRequests();
      return jsonResponse({
        message: "All active access requests approved",
        approvedCount: result.approvedCount,
      });
    } catch (error) {
      console.error(
        "[POST /api/superadmin/access-requests/approve-all]",
        error
      );
      return errorResponse("Internal server error", 500);
    }
  })
);
