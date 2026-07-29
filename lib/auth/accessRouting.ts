import type { User } from "firebase/auth";
import { requiresEmailVerification } from "@/lib/auth/emailVerification";
import { isUserApproved } from "@/lib/auth/isUserApproved";

type AuthRoutingUser = {
  emailVerified?: boolean;
  approved?: boolean | null;
  providerData?: User["providerData"];
};

export function getPostAuthDestination(user: AuthRoutingUser): string {
  if (
    user.providerData &&
    requiresEmailVerification({
      emailVerified: Boolean(user.emailVerified),
      providerData: user.providerData,
    })
  ) {
    return "/verify-email";
  }

  if (user.emailVerified === false) {
    return "/verify-email";
  }

  if (!isUserApproved(user)) {
    return "/no-access";
  }

  return "/dashboard";
}
