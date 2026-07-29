import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { mapMembershipError } from "@/lib/api/mapMembershipError";
import userRepository from "@/server/repositories/userRepository.js";

type DbUser = {
  firebaseUid?: string;
  role?: string;
  business_id?: number | string | null;
};

export const POST = withAuth(
  async (_request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.firebaseUid) {
        return errorResponse("User not found", 401);
      }

      if (user.role === "owner") {
        return errorResponse("Business owners cannot leave their company", 403);
      }

      if (user.business_id == null || user.business_id === "") {
        return errorResponse("You are not affiliated with a company", 400);
      }

      const updatedUser = await userRepository.leaveCompany({
        uid: user.firebaseUid,
      });

      if (!updatedUser) {
        return errorResponse("User not found", 404);
      }

      return jsonResponse({ user: updatedUser });
    } catch (error) {
      console.error("[POST /api/business/leave]", error);

      const mapped = mapMembershipError(error);
      if (mapped) {
        return errorResponse(mapped.message, mapped.status);
      }

      return errorResponse("Internal server error", 500);
    }
  }
);
