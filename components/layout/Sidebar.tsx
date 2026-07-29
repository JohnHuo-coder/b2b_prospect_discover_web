"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ClipboardList,
  LayoutGrid,
  ListTodo,
  LogOut,
  Network,
  Settings,
  Shield,
} from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import {
  getUserDisplayName,
  getUserInitials,
  hasUserName,
} from "@/lib/auth/userDisplay";
import { isUserAdmin } from "@/lib/auth/isUserAdmin";
import { isSuperAdmin } from "@/lib/auth/isSuperAdmin";
import { leaveCompany } from "@/lib/api/business-search-client";
import { Modal } from "@/components/ui/Modal";

const allNavItems: Array<{
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  ownerOnly?: boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, ownerOnly: false },
  { href: "/jobs", label: "Jobs", icon: ListTodo, ownerOnly: false },
  {
    href: "/companies",
    label: "Companies",
    icon: Building2,
    superAdminOnly: true,
  },
  {
    href: "/system-dashboard",
    label: "System Dashboard",
    icon: Network,
    adminOnly: true,
  },
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
  const { user, isLoading, logout, refreshUser } = useUser();
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const businessLabel =
    user?.business_name?.trim() || "No affiliated company";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setConfirmLogoutOpen(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLeaveCompany = async () => {
    setLeaving(true);
    setLeaveError("");

    try {
      await leaveCompany();
      await refreshUser();
      setConfirmLeaveOpen(false);
      router.replace("/dashboard");
    } catch (error) {
      setLeaveError(
        error instanceof Error ? error.message : "Failed to leave company"
      );
    } finally {
      setLeaving(false);
    }
  };

  const profileLabel = user
    ? hasUserName(user)
      ? getUserDisplayName(user)
      : user.email
    : "";
  const profileInitials = user ? getUserInitials(user) : "";
  const isOwner = user?.role === "owner";
  const isAdmin = isUserAdmin(user);
  const isSuperAdminUser = isSuperAdmin(user);
  const canLeaveCompany =
    Boolean(user?.business_id) && user?.role !== "owner" && !isSuperAdminUser;
  const navItems = allNavItems.filter((item) => {
    if (item.superAdminOnly && !isSuperAdminUser) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.ownerOnly && !isOwner) return false;
    return true;
  });

  return (
    <>
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                  {profileInitials}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                  {profileLabel}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {canLeaveCompany ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLeaveError("");
                      setConfirmLeaveOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                  >
                    <Building2 className="h-4 w-4 shrink-0" />
                    Leave company
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setConfirmLogoutOpen(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Log out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      <Modal
        open={confirmLogoutOpen}
        title="Log out?"
        onClose={() => {
          if (loggingOut) return;
          setConfirmLogoutOpen(false);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(false)}
              disabled={loggingOut}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-gray-700">
          Are you sure you want to log out? You will need to sign in again to
          access your account.
        </p>
      </Modal>

      <Modal
        open={confirmLeaveOpen}
        title="Leave company?"
        onClose={() => {
          if (leaving) return;
          setConfirmLeaveOpen(false);
        }}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmLeaveOpen(false)}
              disabled={leaving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleLeaveCompany()}
              disabled={leaving}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {leaving ? "Leaving..." : "Leave company"}
            </button>
          </div>
        }
      >
        <p className="text-sm leading-6 text-gray-700">
          Are you sure you want to leave{" "}
          <strong>{businessLabel}</strong>? You will lose access to this
          company&apos;s data until you join a company again.
        </p>
        {leaveError ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {leaveError}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
