import type { Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";
import { DECISION_WORKFLOW_COPY } from "@/product/experience";

type Props = { locale: Locale; tone?: "dark" | "light"; compact?: boolean; className?: string };

export function DecisionWorkflow({ locale, tone = "dark", compact = false, className }: Props) {
  const dark = tone === "dark";
  return (
    <ol
      aria-label="QDIP decision workflow"
      className={cn(
        "grid overflow-hidden rounded-2xl border md:grid-cols-4",
        compact ? "mt-4" : "mt-8",
        dark ? "border-white/10 bg-white/10" : "border-slate-200 bg-slate-200",
        className,
      )}
    >
      {DECISION_WORKFLOW_COPY[locale].map((step, index) => (
        <li key={step.id} className={cn("min-w-0 p-4 md:p-5", dark ? "bg-slate-950/85" : "bg-white")}>
          <div className={cn("text-[10px] font-bold tracking-[.16em]", dark ? "text-cyan-300" : "text-emerald-700")}>0{index + 1}</div>
          <strong className={cn("mt-2 block text-sm", dark ? "text-white" : "text-slate-900")}>{step.label}</strong>
          <span className={cn("mt-1 block text-xs leading-5", dark ? "text-slate-500" : "text-slate-500")}>{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}
