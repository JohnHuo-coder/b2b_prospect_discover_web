import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type SignupResponse = {
  message: string;
  user: unknown;
  customToken?: string;
};

async function postSignup(
  url: string,
  body: Record<string, string | undefined>
): Promise<SignupResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Signup failed"
    );
  }

  return data as SignupResponse;
}

export function businessSignup(body: {
  business_name: string;
  email: string;
  password: string;
  reason: string;
  first_name?: string;
  last_name?: string;
}) {
  return postSignup(ENDPOINTS.AUTH_BUSINESS_SIGNUP, body);
}

export function memberSignup(body: {
  email: string;
  password: string;
  reason: string;
  first_name?: string;
  last_name?: string;
}) {
  return postSignup(ENDPOINTS.AUTH_MEMBER_SIGNUP, body);
}

export async function submitAccessRequest(reason: string): Promise<void> {
  const response = await authenticatedFetch(ENDPOINTS.AUTH_ACCESS_REQUEST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to submit access request"
    );
  }
}

export async function submitAccessRequestWithToken(
  idToken: string,
  reason: string
): Promise<void> {
  const response = await fetch(ENDPOINTS.AUTH_ACCESS_REQUEST, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Failed to submit access request"
    );
  }
}
