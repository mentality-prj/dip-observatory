import { Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import type { SchedulingDecisionResponse } from "@/production-scheduling/types";
import {
  buildDisruptionFinancialRows,
  getAvoidedDisruptionImpact,
} from "../model";
import { formatEuro } from "../model";

export function DisruptionFinancialPanel({
  preResult,
  disruptedResult,
}: {
  preResult: SchedulingDecisionResponse;
  disruptedResult: SchedulingDecisionResponse;
}) {
  const rows = buildDisruptionFinancialRows(preResult, disruptedResult);
  const avoidedImpact = getAvoidedDisruptionImpact(disruptedResult);
  const recovery = disruptedResult.strategies.find(
    (strategy) => strategy.strategyId === disruptedResult.recommendedStrategy,
  );
  const disrupted = disruptedResult.strategies.find(
    (strategy) => strategy.strategyId === "KEEP_CURRENT_SCHEDULE",
  );

  return (
    <Card data-testid="disruption-financial-impact">
      <CardHeader>
        <CardTitle className="text-base">Financial Impact</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 pr-4 text-left text-xs text-slate-400" />
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-emerald-400">Current Plan</th>
                <th className="py-2 pr-4 text-right text-xs font-semibold uppercase tracking-widest text-rose-400">Without Recovery</th>
                <th className="py-2 text-right text-xs font-semibold uppercase tracking-widest text-cyan-400">{recovery?.strategyLabel ?? "Recovery"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className={`border-b border-white/5 ${row.id === "total" ? "font-semibold" : ""}`}>
                  <td className="py-2 pr-4 text-slate-400">{row.label}</td>
                  <td className="py-2 pr-4 text-right text-emerald-300"><span data-testid={`dis-fin-pre-${row.id}`}>{formatEuro(row.pre)}</span></td>
                  <td className="py-2 pr-4 text-right text-rose-300"><span data-testid={`dis-fin-disrupted-${row.id}`}>{formatEuro(row.disrupted)}</span></td>
                  <td className="py-2 text-right text-cyan-300"><span data-testid={`dis-fin-recovery-${row.id}`}>{formatEuro(row.recovery)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {avoidedImpact > 0 && (
          <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-900/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">AVOIDED IMPACT</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-300" data-testid="disruption-avoided-cost-value">{formatEuro(avoidedImpact)}</span>
              <span className="text-xs text-slate-400">({formatEuro(disrupted?.financialImpact.totalCost ?? 0)} − {formatEuro(recovery?.financialImpact.totalCost ?? 0)})</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
