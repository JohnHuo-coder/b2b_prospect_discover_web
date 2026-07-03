import { jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";

export const GET = withAuth(
  async (
    _request: Request,
    _context: unknown,
    user: Record<string, unknown>
  ) => {
    return jsonResponse(user);
  }
);
