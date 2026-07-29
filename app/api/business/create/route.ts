import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { mapMembershipError } from "@/lib/api/mapMembershipError";
import businessRepository from "@/server/repositories/businessRepository.js";
import userRepository from "@/server/repositories/userRepository.js";

type DbUser = {
  firebaseUid?: string;
  role?: string;
  business_id?: number | string | null;
};

export const POST = withAuth(
  async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.firebaseUid) {
        return errorResponse("User not found", 401);
      }

      if (user.role !== "pending") {
        return errorResponse("Only pending members can create a company", 403);
      }

      if (user.business_id != null && user.business_id !== "") {
        return errorResponse(
          "Cancel your pending join request before creating a company",
          409
        );
      }

      const body = (await request.json()) as { business_name?: unknown };
      const business_name =
        typeof body.business_name === "string" ? body.business_name.trim() : "";

      if (!business_name) {
        return errorResponse("Business name is required", 400);
      }

      await businessRepository.createBusinessForPendingUser({
        uid: user.firebaseUid,
        business_name,
      });

      const updatedUser = await userRepository.findByUid(user.firebaseUid);

      if (!updatedUser) {
        return errorResponse("User not found", 404);
      }

      return jsonResponse(
        {
          message: "Company created successfully",
          user: updatedUser,
        },
        201
      );
    } catch (error) {
      console.error("[POST /api/business/create]", error);

      const mapped = mapMembershipError(error);
      if (mapped) {
        return errorResponse(mapped.message, mapped.status);
      }

      return errorResponse("Internal server error", 500);
    }
  }
);
