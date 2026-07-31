"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import {
  approveAllSuperadminAccessRequests,
  approveSuperadminAccessRequest,
  denySuperadminAccessRequest,
  fetchSuperadminAccessRequests,
  type SuperadminAccessRequest,
} from "@/lib/api/superadmin-access-requests-client";
import { useUser } from "@/components/providers/UserProvider";
import { isSuperAdmin } from "@/lib/auth/isSuperAdmin";
import { ACCESS_REQUEST_STATUS } from "@/lib/constants/access-request";
import { getUserDisplayName, hasUserName } from "@/lib/auth/userDisplay";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

type StatusFilter = "all" | "active";

const statusFilters: StatusFilter[] = ["all", "active"];

const statusFilterLabels: Record<StatusFilter, string> = {
  all: "All",
  active: "Active",
};

function formatSubmittedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequestApplicant({ request }: { request: SuperadminAccessRequest }) {
  const name = hasUserName(request)
    ? getUserDisplayName(request)
    : request.email?.trim() || "—";

  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-zinc-950">{name}</p>
      {request.email ? (
        <p className="truncate text-xs text-zinc-500">{request.email}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === ACCESS_REQUEST_STATUS.APPROVED) {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
        Approved
      </span>
    );
  }

  if (status === ACCESS_REQUEST_STATUS.DENIED) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
        Denied
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      Active
    </span>
  );
}

function RequestActions({
  request,
  disabled,
  onUpdated,
}: {
  request: SuperadminAccessRequest;
  disabled: boolean;
  onUpdated: () => Promise<void>;
}) {
  const [saving, setSaving] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState("");

  if (request.status !== ACCESS_REQUEST_STATUS.ACTIVE) {
    return <span className="text-xs text-zinc-400">Reviewed</span>;
  }

  const handleApprove = async () => {
    setSaving("approve");
    setError("");

    try {
      await approveSuperadminAccessRequest(request.id);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request");
    } finally {
      setSaving(null);
    }
  };

  const handleDeny = async () => {
    setSaving("deny");
    setError("");

    try {
      await denySuperadminAccessRequest(request.id);
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny request");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => void handleApprove()}
          disabled={disabled || saving !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === "approve" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Approve
        </button>
        <button
          type="button"
          onClick={() => void handleDeny()}
          disabled={disabled || saving !== null}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving === "deny" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
          Deny
        </button>
      </div>
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AccessRequestsContent() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useUser();
  const [requests, setRequests] = useState<SuperadminAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [approvingAll, setApprovingAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");

  const activeCount = useMemo(
    () =>
      requests.filter((request) => request.status === ACCESS_REQUEST_STATUS.ACTIVE)
        .length,
    [requests]
  );

  const filteredRequests = useMemo(() => {
    if (statusFilter === "active") {
      return requests.filter(
        (request) => request.status === ACCESS_REQUEST_STATUS.ACTIVE
      );
    }

    return requests;
  }, [requests, statusFilter]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const rows = await fetchSuperadminAccessRequests();
      setRequests(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load access requests"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user || !isSuperAdmin(user)) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !isSuperAdmin(user)) {
      return;
    }

    void loadRequests();
  }, [authLoading, user, loadRequests]);

  const handleApproveAll = async () => {
    if (activeCount === 0 || approvingAll) {
      return;
    }

    setApprovingAll(true);
    setActionError("");

    try {
      await approveAllSuperadminAccessRequests();
      await loadRequests();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to approve all requests"
      );
    } finally {
      setApprovingAll(false);
    }
  };

  if (authLoading || !user || !isSuperAdmin(user)) {
    return (
      <div className="p-8">
        <SkeletonBar className="h-8 w-64" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Superadmin
          </div>
          <h1 className="text-2xl font-semibold text-zinc-950">
            Access Requests
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">
            Review platform access applications. Approving activates the user
            account; denying keeps the request on record without granting
            access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleApproveAll()}
          disabled={approvingAll || activeCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {approvingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve all active ({activeCount})
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {actionError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statusFilters.map((status) => {
          const active = statusFilter === status;

          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "border border-teal-200 bg-teal-50 text-teal-800"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {statusFilterLabels[status]}
              {status === "active" ? ` (${activeCount})` : ""}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Applicant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Business
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Note
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-4" colSpan={7}>
                        <SkeletonBar className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                : null}

              {!loading && filteredRequests.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                    colSpan={7}
                  >
                    {statusFilter === "active"
                      ? "No active access requests."
                      : "No access requests yet."}
                  </td>
                </tr>
              ) : null}

              {!loading
                ? filteredRequests.map((request) => (
                    <tr key={String(request.id)} className="align-top">
                      <td className="px-4 py-4">
                        <RequestApplicant request={request} />
                      </td>
                      <td className="px-4 py-4 capitalize text-zinc-700">
                        {request.role?.trim() || "—"}
                      </td>
                      <td className="px-4 py-4 text-zinc-700">
                        {request.business_name?.trim() || "—"}
                      </td>
                      <td className="max-w-xs px-4 py-4">
                        <p className="whitespace-pre-wrap text-zinc-700">
                          {request.reason}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-zinc-600">
                        {formatSubmittedAt(request.created_at)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-4">
                        <RequestActions
                          request={request}
                          disabled={loading || approvingAll}
                          onUpdated={loadRequests}
                        />
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
