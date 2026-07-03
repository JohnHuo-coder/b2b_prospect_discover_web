// lib/api/middleware/authMiddleware.js
import "@/lib/firebase/firebase.js";
import { getAuth } from "firebase-admin/auth";
import userRepository from "@/server/repositories/userRepository.js";
import { errorResponse } from "@/lib/api/response";

export function withAuth(handler) {
  return async (request, context) => {
    try {
      const token =
        request.cookies.get("session")?.value ||
        request.headers.get("authorization")?.split(" ")[1];

      if (!token) {
        return errorResponse("No Firebase ID token provided", 401);
      }

      const decodedToken = await getAuth().verifyIdToken(token);
      const user = await userRepository.findByUid(decodedToken.uid);

      if (!user) {
        return errorResponse("User not found", 401);
      }

      // 把 user 传给真正的 handler（替代 req.user + next()）
      return handler(request, context, user);
    } catch (error) {
      console.error("Firebase Auth middleware error:", error);
      if (error.code === "auth/id-token-expired") {
        return errorResponse("Firebase ID token expired", 401);
      }
      if (error.code === "auth/invalid-id-token") {
        return errorResponse("Invalid Firebase ID token", 401);
      }
      if (error.code?.startsWith("auth/")) {
        return errorResponse("Authentication failed", 401);
      }
      return errorResponse("Internal server error during authentication", 500);
    }
  };
}
