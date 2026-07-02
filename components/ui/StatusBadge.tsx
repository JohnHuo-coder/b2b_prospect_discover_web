import type { LeadStatus } from "@/lib/mock-data";

const styles: Record<LeadStatus, { dot: string; text: string; label: string }> =
  {
    sent: {
      dot: "bg-blue-500",
      text: "text-blue-700",
      label: "Sent",
    },
    heard_back: {
      dot: "bg-emerald-500",
      text: "text-emerald-700",
      label: "Heard Back",
    },
    pending: {
      dot: "bg-amber-500",
      text: "text-amber-700",
      label: "Pending",
    },
    rejected: {
      dot: "bg-gray-400",
      text: "text-gray-600",
      label: "Rejected",
    },
  };

export function StatusBadge({ status }: { status: LeadStatus }) {
  const style = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm font-medium ${style.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
