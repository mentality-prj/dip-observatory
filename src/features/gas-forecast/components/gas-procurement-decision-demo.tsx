import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/design-system'

export function GasProcurementDecisionDemo({
  volumeMwh,
  deadline,
  horizonDays,
}: {
  volumeMwh: number
  deadline: string
  horizonDays: number
}) {
  return (
    <Card aria-label="Procurement decision overview">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Decision overview</p>
            <CardTitle className="mt-1">How should this gas volume be secured?</CardTitle>
          </div>
          <Badge variant="amber">VALUE NOT YET VALIDATED</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Required volume</p>
            <p className="mt-2 text-lg font-semibold text-white">{volumeMwh.toLocaleString()} MWh</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Procurement deadline</p>
            <p className="mt-2 text-lg font-semibold text-white">{deadline}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Decision horizon</p>
            <p className="mt-2 text-lg font-semibold text-white">{horizonDays} days</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
          <p className="font-medium text-amber-100">No robust recommendation yet</p>
          <p className="mt-1 text-sm text-slate-300">
            QDIP has not yet passed the real frozen-dataset economic validation gate. No savings claim or buy/defer
            allocation is shown until that evidence exists.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Decision</p>
            <p className="mt-2 text-sm text-slate-200">Future validated output: X% buy now / Y% defer.</p>
          </div>
          <div className="rounded-2xl border border-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Economic effect</p>
            <p className="mt-2 text-sm text-slate-200">
              Compared with a named procurement baseline in €/MWh and total €.
            </p>
          </div>
          <div className="rounded-2xl border border-white/8 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risk & uncertainty</p>
            <p className="mt-2 text-sm text-slate-200">
              Downside and uncertainty will be shown separately from the recommendation.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Research protocol, dataset identity and statistical diagnostics remain available below as audit evidence.
        </p>
      </CardContent>
    </Card>
  )
}
