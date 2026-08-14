import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60",
  {
    variants: {
      variant: {
        default:
          "border-cyan-300/30 bg-cyan-300/12 text-cyan-50 shadow-[0_0_30px_rgba(34,211,238,0.16)] hover:border-cyan-200/60 hover:bg-cyan-300/18",
        secondary:
          "border-white/12 bg-white/6 text-slate-100 hover:border-white/20 hover:bg-white/10",
        ghost:
          "border-transparent bg-transparent text-slate-300 hover:bg-white/8 hover:text-white",
        danger:
          "border-rose-300/30 bg-rose-300/12 text-rose-50 hover:border-rose-200/60 hover:bg-rose-300/18",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
