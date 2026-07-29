import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withAdmin } from "@/lib/api/middleware/requireAdminMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

export const GET = withAuth(
  withAdmin(async (_request: Request) => {
    try {
      const businesses = await businessRepository.listAllBusinesses();
      return jsonResponse({ businesses });
    } catch (error) {
      console.error("[GET /api/superadmin/companies]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
