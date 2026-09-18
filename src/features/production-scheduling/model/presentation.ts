import type { StrategyId } from "@/production-scheduling/types";

export function formatEuro(value: number) {
  return `€${Math.round(value).toLocaleString("en-US")}`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)}%`;
}

export const STRATEGY_CLASSES: Record<
  StrategyId,
  { border: string; headerText: string; titleText: string }
> = {
  REDISTRIBUTE_TO_OTHER_LINES: {
    border: "border-emerald-300/20",
    headerText: "text-emerald-400",
    titleText: "text-emerald-200",
  },
  PRIORITIZE_URGENT_ORDERS: {
    border: "border-cyan-300/20",
    headerText: "text-cyan-400",
    titleText: "text-cyan-200",
  },
  DELAY_LOW_PRIORITY_ORDERS: {
    border: "border-amber-300/20",
    headerText: "text-amber-400",
    titleText: "text-amber-200",
  },
  KEEP_CURRENT_SCHEDULE: {
    border: "border-rose-300/20",
    headerText: "text-rose-400",
    titleText: "text-rose-200",
  },
  USE_OVERTIME: {
    border: "border-violet-300/20",
    headerText: "text-violet-400",
    titleText: "text-violet-200",
  },
};
