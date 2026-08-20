import { ChevronRight } from "lucide-react";

import type { TimelinePoint } from "@/lib/observatory-derive";
import type { ObservatoryCopy } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type Props = {
  points: TimelinePoint[];
  copy: ObservatoryCopy;
  // synced with chart revealStep: -1=none, 0=current, 1=predicted, 2=optimistic, 3=conservative
  activeIndex?: number;
};

const toneMap = {
  cyan: "bg-cyan-300",
  emerald: "bg-emerald-300",
  amber: "bg-amber-300",
  rose: "bg-rose-300",
};

export function StateTimeline({ points, copy, activeIndex = -1 }: Props) {
  if (points.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 px-5 py-6 text-sm text-slate-400">
        {copy.timeline.empty}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-stretch gap-0">
      {points.map((point, index) => (
        <div key={point.label} className="flex min-w-0 flex-1 items-stretch">
          <div
            className={cn(
              "relative min-w-[140px] flex-1 overflow-hidden rounded-[20px] border p-4 transition-all duration-300",
              activeIndex === index
                ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_28px_rgba(34,211,238,0.14)]"
                : "border-white/10 bg-white/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full shadow-[0_0_16px_currentColor]",
                  toneMap[point.tone],
                )}
                aria-hidden="true"
              />
              <span className="text-[10px] uppercase tracking-widest text-slate-600">
                t{index}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-white">{point.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {point.detail}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  toneMap[point.tone],
                )}
                style={{
                  width: `${Math.max(6, Math.round(point.score * 100))}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-300">
              {Math.round(point.score * 100)}%
            </p>
          </div>

          {index < points.length - 1 ? (
            <div className="flex shrink-0 items-center px-1 text-slate-600">
              <ChevronRight className="h-4 w-4" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
