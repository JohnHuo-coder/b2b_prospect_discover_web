import { errorResponse, jsonResponse } from "@/lib/api/response";
import businessRepository from "@/server/repositories/businessRepository.js";

type RouteContext = {
  params: Promise<{ business_id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { business_id } = await context.params;
    const body = await request.json();

    if (!Array.isArray(body.requirements) || body.requirements.length === 0) {
      return errorResponse("requirements must be a non-empty array", 400);
    }

    const result = await businessRepository.upsertRequirements({
      business_id,
      requirements: body.requirements,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("[PATCH /config/requirements]", error);
    return errorResponse("Internal server error", 500);
  }
}
