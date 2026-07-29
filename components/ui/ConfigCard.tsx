import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpTooltip } from "@/components/ui/HelpTooltip";

export function ConfigCard({
  icon: Icon,
  title,
  titleHelpContent,
  children,
  footer,
  onEdit,
}: {
  icon: LucideIcon;
  title: string;
  titleHelpContent?: ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {titleHelpContent ? <HelpTooltip content={titleHelpContent} /> : null}
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-violet-600"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : null}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer ? (
        <div className="border-t border-gray-100 px-6 py-3">{footer}</div>
      ) : null}
    </section>
  );
}

export function Field({
  label,
  value,
  className = "",
  hint,
  helpContent,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  hint?: string;
  helpContent?: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        {helpContent ? <HelpTooltip content={helpContent} /> : null}
      </div>
      <div className="text-sm text-gray-900">{value}</div>
      {hint ? <p className="mt-1.5 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

export function TagList({
  items,
  variant = "gray",
}: {
  items: string[];
  variant?: "gray" | "purple";
}) {
  if (items.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const tagClassName =
    variant === "purple"
      ? "rounded-md bg-violet-100 px-3 py-1.5 text-sm text-violet-700"
      : "rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={tagClassName}>
          {item}
        </span>
      ))}
    </div>
  );
}
