import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { ResearchEvidence } from '@/features/gas-forecast/model/research-evidence'

function metric(value: number | null, suffix = '') {
  return value === null ? '—' : `${value.toFixed(3)}${suffix}`
}

export function GasForecastResearchEvidence({ evidence }: { evidence: ResearchEvidence }) {
  return (
    <Card aria-label="Gas Forecast research evidence">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Gas Procurement Decision Experiment · {evidence.experimentVersion}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="rose">RESEARCH GATE {evidence.researchGate}</Badge>
            <Badge variant="amber">PROCUREMENT {evidence.procurementEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">baseline_last · MAE</p>
            <p className="mt-2 text-xl font-semibold text-white">{metric(evidence.baselineLastMae, ' €/MWh')}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ridge · MAE</p>
            <p className="mt-2 text-xl font-semibold text-white">{metric(evidence.ridgeMae, ' €/MWh')}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          No incremental OOS magnitude edge has been established. Disabled procurement is a research-gate outcome, not a
          €0 commercial result.
        </p>
        {evidence.procurementReason ? <p className="text-sm text-amber-100">{evidence.procurementReason}</p> : null}
        <p className="text-xs text-slate-500">
          Fallback rate: {evidence.fallbackRate === null ? '—' : `${(evidence.fallbackRate * 100).toFixed(1)}%`} ·
          Leakage controls: {evidence.leakageControls.length}
        </p>
      </CardContent>
    </Card>
  )
}
