"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import {
  fetchBusinessMembers,
  updateMemberRole,
  type BusinessMember,
} from "@/lib/api/admin-client";
import { useUser } from "@/components/providers/UserProvider";
import { SkeletonBar } from "@/components/ui/SkeletonBar";
import { hasUserName, getUserDisplayName } from "@/lib/auth/userDisplay";

const roleStyles: Record<
  string,
  { dot: string; text: string; label: string }
> = {
  owner: {
    dot: "bg-violet-500",
    text: "text-violet-700",
    label: "Owner",
  },
  member: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    label: "Member",
  },
  pending: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    label: "Pending",
  },
};

function MemberName({ member }: { member: BusinessMember }) {
  if (hasUserName(member)) {
    return (
      <span className="font-medium text-gray-900">
        {getUserDisplayName(member)}
      </span>
    );
  }

  return <span className="text-gray-400">—</span>;
}

function RoleBadge({ role }: { role: string }) {
  const style = roleStyles[role] ?? {
    dot: "bg-gray-400",
    text: "text-gray-600",
    label: role,
  };

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${style.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}

function MemberRoleActions({
  member,
  currentUserUid,
  disabled,
  onUpdated,
}: {
  member: BusinessMember;
  currentUserUid?: string;
  disabled: boolean;
  onUpdated: (member: BusinessMember) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = async (nextRole: "pending" | "member") => {
    if (nextRole === member.role || saving) return;

    setSaving(true);
    setError("");

    try {
      const updated = await updateMemberRole(member.firebaseUid, nextRole);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const isOwner = member.role === "owner";
  const isSelf = member.firebaseUid === currentUserUid;
  const isPending = member.role === "pending";
  const isMember = member.role === "member";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <RoleBadge role={member.role} />

        {!isOwner && !isSelf ? (
          <>
            {isPending ? (
              <button
                type="button"
                disabled={disabled || saving}
                onClick={() => void handleRoleChange("member")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve
              </button>
            ) : null}

            {isMember ? (
              <button
                type="button"
                disabled={disabled || saving}
                onClick={() => void handleRoleChange("pending")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Revoke
              </button>
            ) : null}
          </>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function AdminContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const isOwner = user?.role === "owner";

  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isOwner) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, isOwner, router]);

  useEffect(() => {
    if (authLoading || !isOwner) return;

    let cancelled = false;

    const loadMembers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchBusinessMembers();
        if (!cancelled) {
          setMembers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load team members"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isOwner]);

  const handleMemberUpdated = (updated: BusinessMember) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.firebaseUid === updated.firebaseUid ? updated : member
      )
    );
  };

  if (authLoading || !user) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-32" />
        <SkeletonBar className="mt-3 h-4 w-56" />
        <SkeletonBar className="mt-8 h-64 w-full" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="mt-4 text-sm text-gray-600">
          Only business owners can access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          Team members in your company
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mb-3 text-right text-sm text-gray-500">
        {loading ? "Loading..." : `${members.length} members`}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-6 py-4">
                      <SkeletonBar className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonBar className="h-4 w-48" />
                    </td>
                    <td className="px-6 py-4">
                      <SkeletonBar className="h-6 w-24" />
                    </td>
                  </tr>
                ))
              : members.map((member) => (
                  <tr
                    key={member.firebaseUid}
                    className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/60"
                  >
                    <td className="px-6 py-4 text-sm">
                      <MemberName member={member} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {member.email}
                    </td>
                    <td className="px-6 py-4">
                      <MemberRoleActions
                        member={member}
                        currentUserUid={user.uid}
                        disabled={loading}
                        onUpdated={handleMemberUpdated}
                      />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && members.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No team members found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
