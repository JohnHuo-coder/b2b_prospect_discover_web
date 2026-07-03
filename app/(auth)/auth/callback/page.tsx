import { Suspense } from "react";
import { AuthCallbackContent } from "@/components/auth/AuthCallbackContent";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <p className="text-base text-gray-600">Completing authentication...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
