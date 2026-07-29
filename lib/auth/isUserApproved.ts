export function isUserApproved(
  user: { approved?: boolean | null } | null | undefined
): boolean {
  return user?.approved === true;
}
