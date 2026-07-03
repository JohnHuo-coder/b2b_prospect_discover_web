import { errorResponse } from "@/lib/api/response";

export function withApproved(handler) {  return async (request, context, user) => {
    if (!user.role || user.role === "pending") {
      return errorResponse("User not approved yet", 403);
    }
    return handler(request, context, user);
  };
}
