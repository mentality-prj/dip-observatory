import type { Locale } from '@/lib/observatory-i18n'
import type { ReadinessRecoveryInput, ReadinessRecoveryResult, RecoveryScenario } from './domain'
import { buildEvidenceManifest, type EvidenceMetric } from './evidence-manifest'

const copy={
  en:{title:'Analyst evidence',scope:'Exploratory Observatory computation, not verified Kernel execution',
    source:'Data and model provenance',metrics:'Metric lineage',uncertainty:'Simulation uncertainty',
    warning:'These are outcome quantiles, not confidence intervals for superiority. Comparing many candidates using the same evaluated samples introduces selection bias. No statistical winner is established.',
    empty:'No selected alternative.',sample:'Simulation samples',seed:'Seed',quantiles:'Recovery time P10 / P50 / P90',baseline:'Local heuristic baselines', truncated:'Partial search: may omit better candidates.',
    unknown:'Unverified / not recorded',definition:'Definition',value:'Value',status:'Evidence status'},
  uk:{title:'Докази для аналітика',scope:'Дослідницьке обчислення Observatory, не перевірене виконання Kernel',
    source:'Походження даних і моделі',metrics:'Джерела метрик',uncertainty:'Невизначеність симуляції',
    warning:'Це квантилі результату, а не довірчі інтервали переваги. Порівняння багатьох кандидатів на тих самих симуляціях створює зміщення вибору. Статистичного переможця не встановлено.',
    empty:'Альтернативу не обрано.',sample:'Кількість симуляцій',seed:'Початкове зерно',quantiles:'Час відновлення P10 / P50 / P90',baseline:'Локальні евристичні базові моделі',truncated:'Неповний пошук: кращі кандидати могли бути пропущені.',
    unknown:'Не підтверджено / не записано',definition:'Визначення',value:'Значення',status:'Статус доказів'},
  pl:{title:'Dowody dla analityka',scope:'Eksploracyjne obliczenia Observatory, bez weryfikacji przez Kernel',
    source:'Pochodzenie danych i modelu',metrics:'Źródła metryk',uncertainty:'Niepewność symulacji',
    warning:'Są to kwantyle wyniku, nie przedziały ufności przewagi. Wybieranie spośród wielu wariantów na tych samych próbach prowadzi do obciążenia selekcją. Nie ustalono istotnego statystycznie zwycięzcy.',
    empty:'Nie wybrano wariantu.',sample:'Liczba symulacji',seed:'Ziarno',quantiles:'Czas naprawy P10 / P50 / P90',baseline:'Lokalne heurystyki',truncated:'Wyszukiwanie niepełne: mogły zostać pominięte lepsze warianty.',
    unknown:'Niezweryfikowane / brak danych',definition:'Definicja',value:'Wartość',status:'Status dowodów'},
} as const

function EvidenceRow({metric}:{metric:EvidenceMetric}){
  return <tr className="border-t border-white/10 text-sm">
    <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-300">{metric.key}</th>
    <td className="py-2 pr-4 tabular-nums text-slate-100">{metric.value}</td>
    <td className="py-2 text-slate-400">{metric.definition}</td>
  </tr>
}

export function AnalystEvidence({locale,input,result,selected}:{locale:Locale,input:ReadinessRecoveryInput,result:ReadinessRecoveryResult,selected:RecoveryScenario|null}){
  const t=copy[locale]
  const manifest=buildEvidenceManifest(input,result,selected)
  return <section data-testid="rr-analyst-evidence" className="mt-5 border border-white/10 bg-white/[.02] p-5 md:p-6">
    <h2 className="text-xl font-medium">{t.title}</h2>
    <p className="mt-2 text-sm text-amber-200">{t.scope}</p>
    <h3 className="mt-5 text-sm font-semibold text-slate-200">{t.source}</h3>
    <dl className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
      <div>Schema: <strong className="text-slate-200">{manifest.schema}</strong></div>
      <div>Planner: <strong className="text-slate-200">{manifest.authority}</strong></div>
      <div>As of: <strong className="text-slate-200">{manifest.asOf}</strong></div>
      <div>Execution/revision: <strong className="text-slate-200">{t.unknown}</strong></div>
      <div>Candidate count: <strong className="text-slate-200">{result.frontier.length}</strong></div>
      <div>Evaluation: <strong className="text-slate-200">{t.sample}: {selected?.uncertaintySummary.samples ?? t.unknown}</strong></div>
    </dl>
    {selected ? <>
      <h3 className="mt-5 text-sm font-semibold text-slate-200">{t.uncertainty}</h3>
      <p className="mt-2 text-sm text-slate-300">{t.seed}: {selected.uncertaintySummary.seed} · {t.quantiles}: {manifest.quantiles?.join(' / ')} h</p>
      <p className="mt-2 text-sm text-amber-200">{t.warning}</p>
      <h3 className="mt-5 text-sm font-semibold text-slate-200">{t.metrics}</h3>
      <div className="mt-2 overflow-x-auto"><table className="w-full min-w-[520px] text-left">
        <thead><tr className="text-xs text-slate-500"><th className="pb-2">{t.definition}</th><th className="pb-2">{t.value}</th><th className="pb-2">{t.status}</th></tr></thead>
        <tbody>{manifest.metrics.map(m=><EvidenceRow metric={m} key={m.key}/>)}</tbody>
      </table></div>
    </> : <p className="mt-4 text-sm text-slate-400">{t.empty}</p>}
    <h3 className="mt-5 text-sm font-semibold text-slate-200">{t.baseline}</h3>
    <ul className="mt-2 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
      {result.baselines.map(b=><li key={b.kind} className="border border-white/10 p-2">{b.kind}: {b.scenario ? String(b.scenario.probabilityDemandSatisfied) : t.unknown}</li>)}
    </ul>
    {result.diagnostics.truncatedByNodeBudget||result.diagnostics.truncatedByTimeBudget?<p className="mt-3 text-amber-200">{t.truncated}</p>:null}
  </section>
}
