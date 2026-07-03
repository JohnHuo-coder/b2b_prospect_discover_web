import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import businessRepository from "@/server/repositories/businessRepository.js";

type DbUser = {
  role?: string;
  business_id?: number | string | null;
};

export const GET = withAuth(
  async (request: Request, _context: unknown, user: DbUser) => {
    try {
      const hasCompany =
        user.business_id != null &&
        user.business_id !== "" &&
        user.role !== "pending";

      if (hasCompany) {
        return errorResponse("You are already affiliated with a company", 403);
      }

      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search")?.trim() ?? "";

      if (!search) {
        return jsonResponse({ businesses: [] });
      }

      const businesses = await businessRepository.getBusinesses({ search });

      return jsonResponse({ businesses });
    } catch (error) {
      console.error("[GET /api/business/search]", error);
      return errorResponse("Internal server error", 500);
    }
  }
);
