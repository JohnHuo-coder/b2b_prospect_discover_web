"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import {
  getUserDisplayName,
  getUserInitials,
  hasUserName,
} from "@/lib/auth/userDisplay";

const allNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, ownerOnly: false },
  { href: "/admin", label: "Admin", icon: Shield, ownerOnly: true },
  {
    href: "/human-review",
    label: "Human Review",
    icon: ClipboardList,
    ownerOnly: false,
  },
  {
    href: "/configuration",
    label: "Configuration",
    icon: Settings,
    ownerOnly: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useUser();

  const businessLabel =
    user?.business_name?.trim() || "No affiliated company";

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const profileLabel = user
    ? hasUserName(user)
      ? getUserDisplayName(user)
      : user.email
    : "";
  const profileInitials = user ? getUserInitials(user) : "";
  const isOwner = user?.role === "owner";
  const navItems = allNavItems.filter(
    (item) => !item.ownerOnly || isOwner
  );

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="truncate text-base font-semibold text-gray-900">
          {isLoading ? "..." : businessLabel}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border border-violet-200 bg-violet-50 text-violet-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-violet-600" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
              {profileInitials}
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
              {profileLabel}
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              aria-label="Log out"
              className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
