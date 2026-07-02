import { errorResponse, jsonResponse } from "@/lib/api/response";
import businessRepository from "@/server/repositories/businessRepository.js";

type RouteContext = {
  params: Promise<{ business_id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { business_id } = await context.params;
    const config = await businessRepository.getBusinessConfig(business_id);

    if (!config) {
      return errorResponse("Business config not found", 404);
    }

    return jsonResponse(config);
  } catch (error) {
    console.error("[GET /api/business/config]", error);
    return errorResponse("Internal server error", 500);
  }
}
