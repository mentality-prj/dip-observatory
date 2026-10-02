'use client'

import { useState } from 'react'
import { AnalystDataPanel } from '@/components/observatory/analyst-data-panel'
import type { Locale } from '@/lib/observatory-i18n'
import { runOptimization } from './api'
import {
  SUPPLY_DATA_DICTIONARY,
  downloadSupplyJson,
  importSupplyExactPackage,
  supplyExactTemplate,
  supplyExportAnalysis,
  type SupplyValidationIssue,
} from './data-workspace'
import { SUPPLY_NETWORK_DEMO } from './demo-data'
import type { OptimizationResult, SupplyNetwork } from './domain'
import { formatMoney, formatNumber } from './i18n'

const copy = {
  en: {
    title: 'Exact-data validation run',
    body: 'Run the optimizer directly on the validated exact network. This path does not infer field meaning and never falls back to demo data.',
    run: 'Run exact network',
    running: 'Running…',
    service: 'Service level',
    unserved: 'Unserved demand',
    objective: 'Objective value',
    loss: 'Business loss',
    status: 'Solver status',
    load: 'Load a valid exact template first.',
  },
  uk: {
    title: 'Перевірка на точних даних',
    body: 'Запустіть optimizer безпосередньо на validated exact network. Цей шлях не вгадує семантику полів і ніколи не підміняє ваші дані demo-набором.',
    run: 'Запустити точну мережу',
    running: 'Обчислення…',
    service: 'Service level',
    unserved: 'Незакритий попит',
    objective: 'Objective value',
    loss: 'Business loss',
    status: 'Статус solver',
    load: 'Спочатку імпортуйте валідний exact template.',
  },
  pl: {
    title: 'Uruchomienie na dokładnych danych',
    body: 'Uruchom optimizer bezpośrednio na zwalidowanej dokładnej sieci. Ta ścieżka nie zgaduje semantyki pól i nigdy nie zastępuje danych zestawem demo.',
    run: 'Uruchom dokładną sieć',
    running: 'Obliczanie…',
    service: 'Poziom obsługi',
    unserved: 'Niezrealizowany popyt',
    objective: 'Wartość celu',
    loss: 'Strata biznesowa',
    status: 'Status solvera',
    load: 'Najpierw zaimportuj poprawny exact template.',
  },
} as const

export function SupplyNetworkAnalystDataWorkspace({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [network, setNetwork] = useState<SupplyNetwork | null>(null)
  const [issues, setIssues] = useState<SupplyValidationIssue[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function importExact(file: File) {
    setIssues([])
    setStatus(null)
    setResult(null)
    setError(null)
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const imported = importSupplyExactPackage(parsed)
      if (!imported.input) {
        setNetwork(null)
        setIssues(imported.issues)
        return
      }
      setNetwork(imported.input)
      setStatus(`${file.name} · ${imported.input.warehouses.length} warehouses`)
    } catch (reason) {
      setNetwork(null)
      setIssues([{ path: '$', message: reason instanceof Error ? reason.message : 'Invalid JSON.' }])
    }
  }

  async function runExact() {
    if (!network || running) return
    setRunning(true)
    setError(null)
    try {
      setResult(await runOptimization(network))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Optimization failed.')
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1640px] px-4 sm:px-5 md:px-8 lg:px-10">
      <AnalystDataPanel
        locale={locale}
        dictionary={SUPPLY_DATA_DICTIONARY}
        onExactFile={importExact}
        onDownloadTemplate={() => downloadSupplyJson('qdip-supply-network-template.json', supplyExactTemplate(SUPPLY_NETWORK_DEMO))}
        onExport={() =>
          downloadSupplyJson(
            'qdip-supply-network-analysis.json',
            supplyExportAnalysis(network ?? SUPPLY_NETWORK_DEMO, result ?? undefined)
          )
        }
        exactStatus={status}
        exactIssues={issues}
      />
      <div className="mt-4 border border-white/10 bg-white/[.025] p-5">
        <h2 className="text-lg font-medium text-slate-100">{t.title}</h2>
        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">{t.body}</p>
        <button
          type="button"
          onClick={() => void runExact()}
          disabled={!network || running}
          className="mt-4 bg-sky-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? t.running : t.run}
        </button>
        {!network ? <p className="mt-2 text-xs text-slate-500">{t.load}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        {result ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="supply-exact-result">
            <Metric label={t.service} value={`${Math.round(result.kpis.service_level * 1000) / 10}%`} />
            <Metric label={t.unserved} value={formatNumber(result.kpis.unserved_demand_units, locale)} />
            <Metric label={t.objective} value={formatMoney(result.kpis.objective_value, locale)} />
            <Metric label={t.loss} value={formatMoney(result.kpis.business_loss, locale)} />
            <Metric label={t.status} value={result.solver_status} />
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-slate-950/30 p-3">
      <div className="text-[10px] uppercase tracking-[.1em] text-slate-500">{label}</div>
      <strong className="mt-2 block text-lg text-slate-100">{value}</strong>
    </div>
  )
}
