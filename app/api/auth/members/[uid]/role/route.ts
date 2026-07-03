import { errorResponse, jsonResponse } from "@/lib/api/response";
import { withAuth } from "@/lib/api/middleware/authMiddleware.js";
import { withApproved } from "@/lib/api/middleware/requireApprovalMiddleware.js";
import { withOwner } from "@/lib/api/middleware/withOwnerMiddleware.js";
import userRepository from "@/server/repositories/userRepository.js";

type DbUser = {
  firebaseUid?: string;
  business_id?: number | string | null;
};

type RouteContext = {
  params: Promise<{ uid: string }>;
};

const ALLOWED_ROLES = ["pending", "member", "owner"] as const;
type MemberRole = (typeof ALLOWED_ROLES)[number];

export const PATCH = withAuth(
  withApproved(
    withOwner(async (request: Request, context: RouteContext, user: DbUser) => {
      try {
        if (!user.business_id) {
          return errorResponse("You need to join a company first", 403);
        }

        const { uid } = await context.params;

        if (!uid) {
          return errorResponse("Member uid is required", 400);
        }

        if (uid === user.firebaseUid) {
          return errorResponse("Cannot change your own role", 400);
        }

        const body = (await request.json()) as { role?: unknown };
        const role = typeof body.role === "string" ? body.role.trim() : "";

        if (!ALLOWED_ROLES.includes(role as MemberRole)) {
          return errorResponse("role must be pending, member, or owner", 400);
        }

        const targetUser = await userRepository.findByUid(uid);

        if (!targetUser) {
          return errorResponse("User not found", 404);
        }

        if (String(targetUser.business_id) !== String(user.business_id)) {
          return errorResponse("User is not in your company", 403);
        }

        const updatedUser = await userRepository.setRole(uid, role);

        return jsonResponse({
          message: "User role updated",
          user: updatedUser,
        });
      } catch (error) {
        console.error("[PATCH /api/auth/members/[uid]/role]", error);
        return errorResponse("Internal server error", 500);
      }
    })
  )
);
