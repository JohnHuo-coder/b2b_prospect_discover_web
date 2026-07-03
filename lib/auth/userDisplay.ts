type UserNameFields = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

export function getUserDisplayName(user: UserNameFields): string {
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || user.email?.trim() || "";
}

export function getUserInitials(user: UserNameFields): string {
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();

  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }

  if (first) {
    return first.slice(0, 2).toUpperCase();
  }

  if (last) {
    return last.slice(0, 2).toUpperCase();
  }

  const email = user.email?.trim() ?? "";
  return email.slice(0, 2).toUpperCase() || "?";
}

export function hasUserName(user: UserNameFields): boolean {
  return Boolean(user.first_name?.trim() || user.last_name?.trim());
}
