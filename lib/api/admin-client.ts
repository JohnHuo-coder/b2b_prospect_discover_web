import { ENDPOINTS } from "@/lib/api/endpoints";
import { authenticatedFetch } from "@/lib/api/authenticatedFetch";

export type BusinessMember = {
  firebaseUid: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
};

type MembersResponse = {
  members: BusinessMember[];
};

export async function fetchBusinessMembers(): Promise<BusinessMember[]> {
  const response = await authenticatedFetch(ENDPOINTS.ADMIN_MEMBERS);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to load team members"
    );
  }

  const data = (await response.json()) as MembersResponse;
  return data.members ?? [];
}

export async function updateMemberRole(
  uid: string,
  role: "pending" | "member"
): Promise<BusinessMember> {
  const response = await authenticatedFetch(ENDPOINTS.memberRole(uid), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to update member role"
    );
  }

  const data = (await response.json()) as {
    user: BusinessMember;
  };
  return data.user;
}
