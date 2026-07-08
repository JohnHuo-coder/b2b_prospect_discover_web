import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-zinc-200 bg-zinc-100 text-zinc-700",
        stage: "border-violet-200 bg-violet-50 text-violet-700",
        decision: "border-amber-200 bg-amber-50 text-amber-700",
        retry: "border-teal-200 bg-teal-50 text-teal-700",
        skip: "border-zinc-200 bg-zinc-50 text-zinc-600",
        end: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
