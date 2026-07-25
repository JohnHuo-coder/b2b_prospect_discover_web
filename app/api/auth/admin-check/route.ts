import { jsonResponse, errorResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { isUserAdmin } from "@/lib/auth/isUserAdmin";

export const GET = withAuth(
  async (
    _request: Request,
    _context: unknown,
    user: Record<string, unknown>
  ) => {
    if (!isUserAdmin(user)) {
      return errorResponse("Forbidden", 403);
    }

    return jsonResponse({ ok: true });
  }
);
