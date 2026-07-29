type CodedError = Error & { code?: string };

export function mapMembershipError(
  error: unknown
): { message: string; status: number } | null {
  const coded = error as CodedError;

  if (coded?.code === "55P03") {
    return {
      message: "Another update is in progress. Please try again.",
      status: 409,
    };
  }

  switch (coded?.code) {
    case "ONLY_PENDING":
      return {
        message: "Only pending members can perform this action",
        status: 403,
      };
    case "PENDING_JOIN_EXISTS":
      return {
        message:
          "Cancel your pending join request before creating a company",
        status: 409,
      };
    case "NO_JOIN_REQUEST":
      return {
        message: "You do not have a pending join request to cancel",
        status: 400,
      };
    case "JOIN_REQUEST_CHANGED":
      return {
        message: "You already have a pending join request for another company",
        status: 400,
      };
    case "NOT_COMPANY_MEMBER":
      return {
        message: "User is not in your company",
        status: 403,
      };
    case "CANNOT_APPROVE":
      return {
        message:
          "This user is no longer pending approval. They may have cancelled their request or left the company.",
        status: 409,
      };
    case "CANNOT_LEAVE_AS_OWNER":
      return {
        message: "Business owners cannot leave their company",
        status: 403,
      };
    case "NOT_AFFILIATED":
      return {
        message: "You are not affiliated with a company",
        status: 400,
      };
    case "USER_NOT_FOUND":
      return { message: "User not found", status: 404 };
    case "BUSINESS_ALREADY_EXISTS":
      return {
        message: "You already own a company",
        status: 409,
      };
    default:
      return null;
  }
}
