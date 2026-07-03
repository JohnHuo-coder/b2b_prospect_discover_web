import { auth } from "@/lib/firebase/client";

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const headers = new Headers(init?.headers);
  const user = auth.currentUser;

  if (user) {
    const idToken = await user.getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  }

  return fetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
}
