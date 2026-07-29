"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Eye, Loader2 } from "lucide-react";
import {
  fetchSuperadminCompanies,
  monitorSuperadminCompany,
  type SuperadminCompany,
} from "@/lib/api/superadmin-companies-client";
import { useUser } from "@/components/providers/UserProvider";
import { isSuperAdmin } from "@/lib/auth/isSuperAdmin";
import { SkeletonBar } from "@/components/ui/SkeletonBar";

function normalizeId(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function getOwnerLabel(company: SuperadminCompany): string {
  const first = company.owner_first_name?.trim() ?? "";
  const last = company.owner_last_name?.trim() ?? "";
  const fullName = [first, last].filter(Boolean).join(" ");

  if (fullName) {
    return fullName;
  }

  return company.owner_email?.trim() || "—";
}

export function CompaniesContent() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useUser();
  const [companies, setCompanies] = useState<SuperadminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [monitoringId, setMonitoringId] = useState<string | null>(null);

  const currentBusinessId = normalizeId(user?.business_id);
  const originalBusinessId = normalizeId(user?.original_business_id);

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

    let cancelled = false;

    const loadCompanies = async () => {
      setLoading(true);
      setError("");

      try {
        const rows = await fetchSuperadminCompanies();
        if (!cancelled) {
          setCompanies(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load companies"
          );
          setCompanies([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const handleMonitor = async (company: SuperadminCompany) => {
    const businessId = normalizeId(company.id);
    if (!businessId) return;

    setMonitoringId(businessId);
    setActionError("");

    try {
      await monitorSuperadminCompany(Number(businessId));
      await refreshUser();
      router.push("/dashboard");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to switch company context"
      );
    } finally {
      setMonitoringId(null);
    }
  };

  if (authLoading || !user || !isSuperAdmin(user)) {
    return (
      <div className="px-8 py-8">
        <SkeletonBar className="h-8 w-48" />
      </div>
    );
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
          Monitor any company workspace as a member while keeping superadmin
          access. Switch back to your own company to restore owner permissions.
        </p>
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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Owner Email</th>
              <th className="px-6 py-4">Config Version</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-gray-50">
                  <td className="px-6 py-4" colSpan={5}>
                    <SkeletonBar className="h-5 w-full" />
                  </td>
                </tr>
              ))
            ) : companies.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-12 text-center text-sm text-gray-500"
                  colSpan={5}
                >
                  No companies found.
                </td>
              </tr>
            ) : (
              companies.map((company) => {
                const companyId = normalizeId(company.id);
                const isCurrent = Boolean(
                  companyId && currentBusinessId && companyId === currentBusinessId
                );
                const isHome = Boolean(
                  companyId &&
                    ((originalBusinessId && companyId === originalBusinessId) ||
                      (!originalBusinessId &&
                        user.role === "owner" &&
                        companyId === currentBusinessId))
                );
                const isMonitoring = monitoringId === companyId;
                const monitorLabel =
                  isHome && isCurrent && user.role === "owner"
                    ? "Current"
                    : isHome
                      ? "Return as owner"
                      : isCurrent
                        ? "Monitoring"
                        : "Monitor";

                return (
                  <tr
                    key={companyId ?? company.business_name ?? Math.random()}
                    className={`border-b border-gray-50 last:border-b-0 ${
                      isCurrent ? "bg-violet-50/60" : "hover:bg-gray-50/60"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {company.business_name?.trim() || "—"}
                          </p>
                          {isHome ? (
                            <p className="text-xs font-medium text-violet-600">
                              Your company
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {getOwnerLabel(company)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {company.owner_email?.trim() || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {company.version ?? 0}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={
                          isMonitoring ||
                          (isCurrent && user.role === "owner" && isHome) ||
                          (isCurrent && !isHome && user.role === "member")
                        }
                        onClick={() => void handleMonitor(company)}
                        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                      >
                        {isMonitoring ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {isMonitoring ? "Switching..." : monitorLabel}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
