import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import userRepository from "@/server/repositories/userRepository.js";
import { pool } from "@/lib/db/client.ts";

type DbUser = {
  firebaseUid?: string;
  role?: string;
  business_id?: number | string | null;
};

async function businessExists(business_id: number | string) {
  const { rows } = await pool.query(
    `SELECT id FROM prospect_discover.businesses WHERE id = $1`,
    [business_id]
  );
  return rows.length > 0;
}

export const PATCH = withAuth(
  async (request: Request, _context: unknown, user: DbUser) => {
    try {
      if (user.role !== "pending") {
        return errorResponse("Only pending members can request to join a company", 403);
      }

      if (!user.firebaseUid) {
        return errorResponse("User not found", 401);
      }

      const body = (await request.json()) as { business_id?: unknown };
      const rawBusinessId = body.business_id;

      if (rawBusinessId === null || rawBusinessId === undefined || rawBusinessId === "") {
        const updatedUser = await userRepository.updateUserBusinessId({
          uid: user.firebaseUid,
          business_id: null,
        });

        if (!updatedUser) {
          return errorResponse("User not found", 404);
        }

        return jsonResponse({ user: updatedUser });
      }

      const business_id = Number(rawBusinessId);
      if (!Number.isInteger(business_id) || business_id < 1) {
        return errorResponse("business_id must be a valid integer", 400);
      }

      if (
        user.business_id != null &&
        user.business_id !== "" &&
        String(user.business_id) !== String(business_id)
      ) {
        return errorResponse(
          "You already have a pending join request for another company",
          400
        );
      }

      if (!(await businessExists(business_id))) {
        return errorResponse("Business not found", 404);
      }

      const updatedUser = await userRepository.updateUserBusinessId({
        uid: user.firebaseUid,
        business_id,
      });

      if (!updatedUser) {
        return errorResponse("User not found", 404);
      }

      return jsonResponse({ user: updatedUser });
    } catch (error) {
      console.error("[PATCH /api/business/join]", error);
      return errorResponse("Internal server error", 500);
    }
  }
);
