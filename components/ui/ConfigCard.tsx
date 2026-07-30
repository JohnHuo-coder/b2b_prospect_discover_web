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
    <section className="config-card rounded-xl border border-zinc-200/90 bg-white/90 shadow-[0_20px_50px_-30px_rgba(24,24,27,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-zinc-500" />
          <h2 className="text-sm font-semibold text-zinc-950">{title}</h2>
          {titleHelpContent ? <HelpTooltip content={titleHelpContent} /> : null}
        </div>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-teal-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
        ) : null}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer ? (
        <div className="border-t border-zinc-100 px-6 py-3">{footer}</div>
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </p>
        {helpContent ? <HelpTooltip content={helpContent} /> : null}
      </div>
      <div className="text-sm text-zinc-950">{value}</div>
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
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
    return <span className="text-sm text-zinc-400">?</span>;
  }

  const tagClassName =
    variant === "purple"
      ? "rounded-md bg-teal-100 px-3 py-1.5 text-sm text-teal-800"
      : "rounded-md bg-zinc-100 px-3 py-1.5 text-sm text-zinc-700";

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
