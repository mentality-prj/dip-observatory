import { Badge, Card, CardContent, CardHeader, CardTitle } from '@/design-system'
import type { ResearchManifest } from '@/features/gas-forecast/model/research-manifest'

function label(metric: string) {
  return metric.replaceAll('_', ' ')
}

export function GasForecastResearchManifest({ manifest }: { manifest: ResearchManifest }) {
  return (
    <Card aria-label="Gas Forecast experiment protocol">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Experiment protocol · v{manifest.version}</CardTitle>
          <Badge variant="cyan">{manifest.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Hypothesis</p>
          <p className="mt-2 text-sm text-slate-300">{manifest.hypothesis}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dataset</p>
            <p className="mt-2 text-sm text-white">{manifest.dataset.version}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-500">{manifest.dataset.hash}</p>
          </div>
          <div className="rounded-xl border border-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Window</p>
            <p className="mt-2 text-sm text-white">{manifest.dataset.observation_window}</p>
            <p className="mt-1 text-xs text-slate-500">{manifest.dataset.sources.join(' · ')}</p>
          </div>
          <div className="rounded-xl border border-white/8 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Alternatives</p>
            <p className="mt-2 text-sm text-white">{manifest.decision_alternatives.join(' · ')}</p>
            <p className="mt-1 text-xs text-slate-500">Horizons: {manifest.horizons.join(', ')}d</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">Primary business metrics</p>
            <p className="mt-2 text-sm text-slate-300">{manifest.primary_metrics.map(label).join(' · ')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Diagnostic metrics</p>
            <p className="mt-2 text-sm text-slate-400">{manifest.secondary_metrics.map(label).join(' · ')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
