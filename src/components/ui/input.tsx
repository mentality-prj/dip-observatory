import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/8 focus:ring-2 focus:ring-cyan-300/20",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
