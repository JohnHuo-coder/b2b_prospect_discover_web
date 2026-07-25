import { errorResponse } from "@/lib/api/response";
import { isUserAdmin } from "@/lib/auth/isUserAdmin";

export function withAdmin(handler) {
  return async (request, context, user) => {
    if (!isUserAdmin(user)) {
      return errorResponse("Forbidden", 403);
    }

    return handler(request, context, user);
  };
}
