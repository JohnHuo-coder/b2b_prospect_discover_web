import { errorResponse } from "@/lib/api/response";

export function withOwner(handler) {
  return async (request, context, user) => {
    if (user.role !== "owner") {
      return errorResponse("Only business owners can edit configuration", 403);
    }
    return handler(request, context, user);
  };
}
