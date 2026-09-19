import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { cn } from "@/lib/utils";
import type { SchedulingDecisionResponse } from "@/production-scheduling/types";
import { buildDisruptionSchedulePresentation } from "../model";

const LINES = ["LINE-A", "LINE-B", "LINE-C"] as const;
const LINE_NAMES: Record<string, string> = {
  "LINE-A": "Machine A",
  "LINE-B": "Machine B",
  "LINE-C": "Machine C",
};

export function DisruptionScheduleDiff({ disruptedResult }: { disruptedResult: SchedulingDecisionResponse }) {
  const model = buildDisruptionSchedulePresentation(disruptedResult);

  return (
    <Card data-testid="disruption-schedule-diff">
      <CardHeader><CardTitle className="text-base">Schedule Comparison</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          <ScheduleColumn label="DISRUPTED PLAN" tone="disrupted" schedule={model.disruptedSchedule} />
          <ScheduleColumn
            label="RECOVERY PLAN"
            tone="recovery"
            schedule={model.recoverySchedule}
            affectedLineId={model.affectedLineId}
            affectedLineUnavailable={model.isAffectedLineUnavailable}
            movedOrderIds={model.movedOrderIds}
            rescuedOrderIds={model.rescuedOrderIds}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500">
          {model.movedOrderIds.size > 0 && <Legend className="border-cyan-400/40 bg-cyan-900/20" text="Moved to another line" />}
          {model.rescuedOrderIds.size > 0 && <Legend className="border-emerald-400/40 bg-emerald-900/20" text="Rescued (was delayed or not scheduled without recovery)" />}
          {model.recoverySchedule.some((task) => task.isOvertime) && <Legend className="border-amber-400/40 bg-amber-900/20" text="Overtime" />}
          {model.recoverySchedule.some((task) => task.status === "DELAYED") && <Legend className="border-rose-400/30 bg-rose-900/10" text="Still delayed" />}
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleColumn({ label, tone, schedule, affectedLineId, affectedLineUnavailable = false, movedOrderIds = new Set(), rescuedOrderIds = new Set() }: {
  label: string;
  tone: "disrupted" | "recovery";
  schedule: ReturnType<typeof buildDisruptionSchedulePresentation>["recoverySchedule"];
  affectedLineId?: string;
  affectedLineUnavailable?: boolean;
  movedOrderIds?: ReadonlySet<string>;
  rescuedOrderIds?: ReadonlySet<string>;
}) {
  return (
    <div>
      <p className={cn("mb-3 text-xs font-semibold uppercase tracking-widest", tone === "recovery" ? "text-cyan-400" : "text-rose-400")}>{label}</p>
      {LINES.map((lineId) => {
        const unavailable = affectedLineUnavailable && affectedLineId === lineId;
        const tasks = schedule.filter((task) => task.lineId === lineId && task.day >= 1);
        return (
          <div key={lineId} className="mb-3">
            <p className="mb-1 text-xs font-medium text-slate-400">{LINE_NAMES[lineId]}{unavailable && <span className="ml-2 text-[10px] font-semibold text-rose-400">[UNAVAILABLE D1]</span>}</p>
            {unavailable && tasks.length === 0 ? (
              <div className="rounded border border-rose-400/30 bg-rose-900/10 px-2 py-1 text-xs text-rose-400">MACHINE UNAVAILABLE</div>
            ) : (
              <div className="space-y-1">{tasks.length === 0 ? <p className="text-xs text-slate-600">—</p> : tasks.map((task) => (
                <div key={task.orderId} className={cn("rounded px-2 py-1 text-xs", taskClass(task, movedOrderIds, rescuedOrderIds))}>
                  {task.orderId} · D{task.day}
                  {movedOrderIds.has(task.orderId) && <span className="ml-1 text-[10px]">↗ MOVED</span>}
                  {rescuedOrderIds.has(task.orderId) && <span className="ml-1 text-[10px]">✓ RESCUED</span>}
                  {task.isOvertime && <span className="ml-1 text-[10px]">OT</span>}
                  {task.status === "DELAYED" && <span className="ml-1 text-[10px]">⚠ {task.daysLate}d</span>}
                </div>
              ))}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function taskClass(task: ReturnType<typeof buildDisruptionSchedulePresentation>["recoverySchedule"][number], moved: ReadonlySet<string>, rescued: ReadonlySet<string>) {
  if (moved.has(task.orderId)) return "border border-cyan-400/40 bg-cyan-900/20 text-cyan-200";
  if (rescued.has(task.orderId)) return "border border-emerald-400/40 bg-emerald-900/20 text-emerald-200";
  if (task.isOvertime) return "border border-amber-400/40 bg-amber-900/20 text-amber-200";
  if (task.status === "DELAYED") return "border border-rose-400/30 bg-rose-900/10 text-rose-300";
  return "bg-slate-800/50 text-slate-300";
}

function Legend({ className, text }: { className: string; text: string }) {
  return <span className="inline-flex items-center gap-1"><span className={cn("inline-block h-2 w-3 rounded border", className)} />{text}</span>;
}
