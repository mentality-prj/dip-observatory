import * as React from "react";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "text-xs font-medium uppercase tracking-[0.18em] text-slate-400",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
