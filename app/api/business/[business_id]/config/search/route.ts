import { errorResponse, jsonResponse } from "@/lib/api/response";
import businessRepository from "@/server/repositories/businessRepository.js";

type RouteContext = {
  params: Promise<{ business_id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { business_id } = await context.params;
    const body = await request.json();
    const result = await businessRepository.upsertSearchConfig({
      business_id,
      ...body,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("[PATCH /config/search]", error);
    return errorResponse("Internal server error", 500);
  }
}
