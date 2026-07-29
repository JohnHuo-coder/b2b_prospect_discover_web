import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { normalizeAccessReason } from "@/lib/auth/normalizeAccessReason";
import requestRepository from "@/server/repositories/requestRepository.js";
import userRepository from "@/server/repositories/userRepository.js";

type DbUser = {
  firebaseUid?: string;
  approved?: boolean;
  id?: number | string;
};

export const POST = withAuth(
  async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.firebaseUid) {
        return errorResponse("User not found", 401);
      }

      if (user.approved === true) {
        return errorResponse("Your account is already approved", 400);
      }

      const body = (await request.json()) as { reason?: unknown };
      const reason = normalizeAccessReason(body.reason);

      if (!reason) {
        return errorResponse("Note for website developer is required", 400);
      }

      const dbUser = await userRepository.findByUid(user.firebaseUid);
      if (!dbUser?.id) {
        return errorResponse("User not found", 404);
      }

      const alreadySubmitted = await requestRepository.hasAccessRequest(dbUser.id);
      if (alreadySubmitted) {
        return jsonResponse({ message: "Access request already submitted" });
      }

      const accessRequest = await requestRepository.createAccessRequest({
        user_id: dbUser.id,
        reason,
      });

      return jsonResponse(
        {
          message: "Access request submitted",
          request: accessRequest,
        },
        201
      );
    } catch (error) {
      console.error("[POST /api/auth/access-request]", error);
      return errorResponse("Internal server error", 500);
    }
  }
);
