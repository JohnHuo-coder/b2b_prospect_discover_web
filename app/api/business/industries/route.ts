import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import industryRepository from "@/server/repositories/industryRepository.js";

export const GET = withAuth(
  withApproved(async (request: Request) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("search")?.trim() ?? "";

      if (!search) {
        return jsonResponse({ industries: [] });
      }

      const industries = await industryRepository.searchIndustries(search);
      return jsonResponse({ industries });
    } catch (error) {
      console.error("[GET /api/business/industries]", error);
      return errorResponse("Internal server error", 500);
    }
  })
);
