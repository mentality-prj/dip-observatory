import type { TimelinePoint } from "@/lib/observatory-derive";
import type { ObservatoryCopy } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type Props = {
  points: TimelinePoint[];
  copy: ObservatoryCopy;
};

const toneMap = {
  cyan: "bg-cyan-300",
  emerald: "bg-emerald-300",
  amber: "bg-amber-300",
  rose: "bg-rose-300",
};

export function StateTimeline({ points, copy }: Props) {
  if (points.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 px-5 py-6 text-sm text-slate-400">
        {copy.timeline.empty}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {points.map((point, index) => (
        <div
          key={point.label}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 p-4"
        >
          {index < points.length - 1 ? (
            <div className="absolute right-0 top-8 hidden h-px w-10 translate-x-1/2 bg-white/10 md:block" />
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <div
              className={cn(
                "h-3 w-3 rounded-full shadow-[0_0_24px_currentColor]",
                toneMap[point.tone],
              )}
              aria-hidden="true"
            />
            <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
              t{index}
            </span>
          </div>
          <p className="mt-4 text-sm font-medium text-white">{point.label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {point.detail}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className={cn("h-full rounded-full", toneMap[point.tone])}
              style={{
                width: `${Math.max(6, Math.round(point.score * 100))}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
            {Math.round(point.score * 100)}%
          </p>
        </div>
      ))}
    </div>
  );
}
