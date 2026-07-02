export function withAdmin(handler) {
  return async (request, context, user) => {
    if (user.role !== "admin") {
      return errorResponse("Admin access required", 403);
    }
    return handler(request, context, user);
  };
}