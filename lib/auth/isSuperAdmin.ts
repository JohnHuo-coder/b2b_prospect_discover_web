export function isSuperAdmin(
  user: { is_admin?: boolean | null } | null | undefined
): boolean {
  return user?.is_admin === true;
}
