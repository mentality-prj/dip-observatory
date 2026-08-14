import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.24em]",
  {
    variants: {
      variant: {
        neutral: "border-white/12 bg-white/6 text-slate-300",
        cyan: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
        emerald: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
        amber: "border-amber-300/30 bg-amber-300/10 text-amber-100",
        rose: "border-rose-300/30 bg-rose-300/10 text-rose-100",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
