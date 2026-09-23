'use client'

import {
  studioCopy,
  useStudioLocale,
  type Audit,
  type DimensionResult,
} from '@/features/studio'

type GasSignals = {
  current_price_eur_mwh?: number
  expected_price_eur_mwh?: number
  expected_price_change_eur_mwh?: number
  expected_return_pct?: number
  probability_price_up?: number
  probability_price_down?: number
  expected_saving_eur_mwh?: number
  expected_adverse_move_eur_mwh?: number
  forecast_distribution?: { p10_eur_mwh?: number; p50_eur_mwh?: number; p90_eur_mwh?: number }
  forecast_interval_width?: number | null
  uncertainty?: number
  uncertainty_calibrated?: boolean
  confidence?: number | null
  confidence_calibrated?: boolean
  forecast_horizon_days?: number
  data_quality?: Record<string, unknown>
  evidence?: Array<Record<string, unknown>>
  provenance?: Record<string, unknown>
}

const eur = (value?: number) => (value == null ? '—' : `€${value.toFixed(2)}/MWh`)
const pct = (value?: number) => (value == null ? '—' : `${(value * 100).toFixed(1)}%`)

function dimension(alternative: Audit['dimension_results'][number], id: string): DimensionResult | undefined {
  return alternative.dimensions.find((item) => item.dimension_id === id)
}

function valueText(result?: DimensionResult): string {
  if (!result || result.value == null) return '—'
  if (typeof result.value === 'number') return result.value.toFixed(3)
  if (typeof result.value === 'object' && result.value && 'amount' in result.value) {
    const value = result.value as { amount?: number; currency?: string }
    return value.amount == null ? '—' : `${value.amount.toFixed(2)} ${value.currency ?? ''}`.trim()
  }
  return JSON.stringify(result.value)
}

export default function GasForecastStudioPanel({ audit }: { audit: Audit }) {
  const copy = studioCopy(useStudioLocale()).gasPanel
  const signals = audit.plugin_outputs as GasSignals
  const evidence = signals.evidence?.[0]
  const baseline = evidence?.model_status === 'baseline'
  const distribution = signals.forecast_distribution

  return (
    <>
      <section className="studio-card gas-forecast-card">
        <header>
          <div>
            <h2>{copy.title}</h2>
            <p>{signals.forecast_horizon_days ?? '—'}-{copy.dayOutlook}</p>
          </div>
          {baseline && <span className="studio-tag">{copy.baseline}</span>}
        </header>
        <div className="gas-metric-grid">
          <div>
            <span>{copy.currentTtf}</span>
            <strong>{eur(signals.current_price_eur_mwh)}</strong>
          </div>
          <div>
            <span>{copy.expectedPrice}</span>
            <strong>{eur(signals.expected_price_eur_mwh)}</strong>
          </div>
          <div>
            <span>{copy.expectedChange}</span>
            <strong>{eur(signals.expected_price_change_eur_mwh)}</strong>
          </div>
          <div>
            <span>{copy.expectedReturn}</span>
            <strong>{pct(signals.expected_return_pct)}</strong>
          </div>
          <div>
            <span>{copy.priceLower}</span>
            <strong>{pct(signals.probability_price_down)}</strong>
          </div>
          <div>
            <span>{copy.priceHigher}</span>
            <strong>{pct(signals.probability_price_up)}</strong>
          </div>
        </div>
        {distribution && (
          <div className="gas-range" aria-label={copy.distribution}>
            <h3>{copy.distribution}</h3>
            <div>
              <span>P10 {eur(distribution.p10_eur_mwh)}</span>
              <span>P50 {eur(distribution.p50_eur_mwh)}</span>
              <span>P90 {eur(distribution.p90_eur_mwh)}</span>
            </div>
            <small>{copy.distributionHelp}</small>
          </div>
        )}
        <div className="gas-metric-grid">
          <div>
            <span>{copy.expectedSaving}</span>
            <strong>{eur(signals.expected_saving_eur_mwh)}</strong>
          </div>
          <div>
            <span>{copy.adverseMove}</span>
            <strong>{eur(signals.expected_adverse_move_eur_mwh)}</strong>
          </div>
          <div>
            <span>{copy.uncertainty}</span>
            <strong>{signals.uncertainty == null ? '—' : signals.uncertainty.toFixed(3)}</strong>
            <small>{signals.uncertainty_calibrated ? copy.calibrated : copy.notCalibrated}</small>
          </div>
          <div>
            <span>{copy.confidence}</span>
            <strong>{signals.confidence == null ? copy.unavailable : pct(signals.confidence)}</strong>
            <small>{signals.confidence_calibrated ? copy.calibrated : copy.notCalibrated}</small>
          </div>
        </div>
        <details>
          <summary>{copy.evidence}</summary>
          <pre>
            {JSON.stringify(
              { data_quality: signals.data_quality, evidence: signals.evidence, provenance: signals.provenance },
              null,
              2
            )}
          </pre>
        </details>
      </section>
      <section className="studio-card">
        <h2>{copy.procurement}</h2>
        <div className="studio-table-wrap">
          <table className="studio-table">
            <thead>
              <tr>
                <th>{copy.alternative}</th>
                <th>{copy.expectedCost}</th>
                <th>{copy.expectedEffect}</th>
                <th>{copy.risk}</th>
                <th>{copy.uncertainty}</th>
                <th>{copy.constraints}</th>
                <th>{copy.policy}</th>
                <th>{copy.score}</th>
              </tr>
            </thead>
            <tbody>
              {audit.dimension_results.map((alternative) => {
                const constraints = dimension(alternative, 'constraints')
                const policy = dimension(alternative, 'policy')
                return (
                  <tr
                    key={alternative.alternative_id}
                    className={audit.selected_alternative === alternative.alternative_id ? 'gas-selected' : ''}
                  >
                    <td>
                      <strong>{alternative.alternative_id}</strong>
                      {!alternative.feasible && <small className="gas-blocked">{copy.infeasible}</small>}
                    </td>
                    <td>{valueText(dimension(alternative, 'cost'))}</td>
                    <td>{valueText(dimension(alternative, 'expected_effect'))}</td>
                    <td>{valueText(dimension(alternative, 'risk'))}</td>
                    <td>{valueText(dimension(alternative, 'uncertainty'))}</td>
                    <td>{constraints?.status ?? '—'}</td>
                    <td>{policy?.status ?? '—'}</td>
                    <td>{alternative.score?.toFixed(4) ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p>
          {copy.selectedDecision}: <strong>{audit.selected_alternative ?? copy.noAlternative}</strong>
        </p>
      </section>
    </>
  )
}
