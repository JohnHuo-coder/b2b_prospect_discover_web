import { Pencil } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function ConfigCard({
  icon: Icon,
  title,
  children,
  footer,
  onEdit,
}: {
  icon: LucideIcon;
  title: string;
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
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

export function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
