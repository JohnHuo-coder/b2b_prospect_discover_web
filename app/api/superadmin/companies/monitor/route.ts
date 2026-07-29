import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withAdmin } from "@/lib/api/middleware/requireAdminMiddleware.js";
import userRepository from "@/server/repositories/userRepository.js";

type DbUser = {
  firebaseUid?: string;
};

function mapSuperadminMonitorError(error: unknown) {
  const coded = error as Error & { code?: string };

  if (coded?.code === "55P03") {
    return {
      message: "Another update is in progress. Please try again.",
      status: 409,
    };
  }

  switch (coded?.code) {
    case "NOT_SUPERADMIN":
      return { message: "Forbidden", status: 403 };
    case "BUSINESS_NOT_FOUND":
      return { message: "Business not found", status: 404 };
    case "INVALID_BUSINESS_ID":
      return { message: "business_id must be a valid integer", status: 400 };
    case "USER_NOT_FOUND":
      return { message: "User not found", status: 404 };
    default:
      return null;
  }
}

export const POST = withAuth(
  withAdmin(async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (!user.firebaseUid) {
        return errorResponse("User not found", 401);
      }

      const body = (await request.json()) as { business_id?: unknown };
      const business_id = Number(body.business_id);

      const updatedUser = await userRepository.switchSuperadminCompanyContext({
        uid: user.firebaseUid,
        business_id,
      });

      return jsonResponse({
        message: "Company context updated",
        user: updatedUser,
      });
    } catch (error) {
      console.error("[POST /api/superadmin/companies/monitor]", error);

      const mapped = mapSuperadminMonitorError(error);
      if (mapped) {
        return errorResponse(mapped.message, mapped.status);
      }

      return errorResponse("Internal server error", 500);
    }
  })
);
