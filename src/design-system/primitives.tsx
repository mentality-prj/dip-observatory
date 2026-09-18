import * as React from "react";
import { cn } from "@/lib/utils";

export function AppShell({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-app-shell", className)} {...props} />;
}
export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("ds-container", className)} {...props} />;
}
export function Page({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <main className={cn("ds-page", className)} {...props} />;
}
export function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn("ds-section", className)} {...props} />;
}

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => <select ref={ref} className={cn("ds-select", className)} {...props} />,
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn("ds-textarea", className)} {...props} />,
);
Textarea.displayName = "Textarea";

export const Checkbox = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">>(
  ({ className, ...props }, ref) => <input ref={ref} type="checkbox" className={cn("ds-checkbox", className)} {...props} />,
);
Checkbox.displayName = "Checkbox";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <div className="ds-table-wrap"><table className={cn("ds-table", className)} {...props} /></div>;
}

export function Disclosure({ className, ...props }: React.DetailsHTMLAttributes<HTMLDetailsElement>) {
  return <details className={cn("ds-disclosure", className)} {...props} />;
}
