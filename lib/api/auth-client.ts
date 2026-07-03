import { ENDPOINTS } from "@/lib/api/endpoints";

export type SignupResponse = {
  message: string;
  user: unknown;
  customToken?: string;
};

async function postSignup(
  url: string,
  body: Record<string, string>
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
}) {
  return postSignup(ENDPOINTS.AUTH_BUSINESS_SIGNUP, body);
}

export function memberSignup(body: { email: string; password: string }) {
  return postSignup(ENDPOINTS.AUTH_MEMBER_SIGNUP, body);
}
