'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, PlugZap, RefreshCw } from 'lucide-react'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'

type Capability = {
  plugin_id: string
  plugin_version: string
  capability_id: string
  capability_version: string
  schema_version: string
  output_type: string
  status: string
}
type Catalog = { count: number; items: Capability[] }
const labels = {
  en: { title: 'Connected plugins', intro: 'Live capabilities registered through the QDIP Gateway.', search: 'Search plugins', refresh: 'Refresh', empty: 'No connected plugins found.', offline: 'Plugin catalog is unavailable. Sign in or check your connection.', version: 'Version', schema: 'Schema', output: 'Output', open: 'Select capability', selected: 'Selected capability', noSelection: 'Choose a capability to inspect its contract.', notice: 'Execution requires a separate organization-scoped permission. API credentials are never sent to the browser.' },
  uk: { title: 'Підключені плагіни', intro: 'Активні capabilities, зареєстровані через QDIP Gateway.', search: 'Пошук плагінів', refresh: 'Оновити', empty: 'Підключених плагінів немає.', offline: 'Каталог недоступний. Увійдіть або перевірте з’єднання.', version: 'Версія', schema: 'Схема', output: 'Результат', open: 'Вибрати capability', selected: 'Обрана capability', noSelection: 'Виберіть capability для перегляду контракту.', notice: 'Виклик потребує окремого дозволу організації. API-ключі ніколи не передаються браузеру.' },
  pl: { title: 'Podłączone wtyczki', intro: 'Aktywne capabilities zarejestrowane w QDIP Gateway.', search: 'Szukaj wtyczek', refresh: 'Odśwież', empty: 'Brak podłączonych wtyczek.', offline: 'Katalog jest niedostępny. Zaloguj się lub sprawdź połączenie.', version: 'Wersja', schema: 'Schemat', output: 'Wynik', open: 'Wybierz capability', selected: 'Wybrana capability', noSelection: 'Wybierz capability, aby zobaczyć kontrakt.', notice: 'Wywołanie wymaga osobnych uprawnień organizacji. Klucze API nigdy nie trafiają do przeglądarki.' },
} as const

export function PluginWorkspace({ locale }: { locale: Locale }) {
  const copy = labels[locale]
  const [items, setItems] = useState<Capability[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(false)
    try {
      const response = await fetch('/api/observatory/workers', { credentials: 'same-origin', cache: 'no-store', signal })
      if (!response.ok) throw new Error('Catalog unavailable')
      const data: Catalog = await response.json()
      if (!Array.isArray(data.items)) throw new Error('Invalid catalog')
      if (!signal?.aborted) setItems(data.items)
    } catch {
      if (!signal?.aborted) { setItems([]); setError(true) }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal)
    return () => controller.abort()
  }, [refresh])
  const visible = items.filter((item) => (item.plugin_id + ' ' + item.capability_id).toLowerCase().includes(search.toLowerCase()))
  const active = items.find((item) => item.capability_id === selected)
  return (
    <section className="mt-14" aria-labelledby="plugin-workspace-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">QDIP SDK-02</p>
          <h2 id="plugin-workspace-title" className="mt-2 text-2xl font-medium">{copy.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{copy.intro}</p>
        </div>
        <Button type="button" variant="secondary" disabled={loading} onClick={() => void refresh()}>
          <RefreshCw className="mr-2 inline h-4 w-4" aria-hidden />{copy.refresh}
        </Button>
      </div>
      <div className="mb-5 max-w-md">
        <label className="block text-sm text-slate-300">
          {copy.search}
          <Input className="mt-2" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>
      {error ? <p role="alert" className="mb-4 text-sm text-amber-200">{copy.offline}</p> : null}
      {loading ? <p role="status" className="text-sm text-slate-400">…</p> : null}
      {!loading && !error && visible.length === 0 ? <p role="status" className="text-sm text-slate-400">{copy.empty}</p> : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <Card key={item.plugin_id + ':' + item.capability_id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <PlugZap className="h-5 w-5 text-cyan-300" aria-hidden />
                <Badge>{item.status}</Badge>
              </div>
              <CardTitle>{item.plugin_id}</CardTitle>
              <p className="break-all text-sm text-slate-400">{item.capability_id}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">{copy.version}: {item.plugin_version} · {copy.schema}: {item.schema_version}</p>
              <p className="mt-1 text-xs text-slate-400">{copy.output}: {item.output_type}</p>
              <Button className="mt-5" variant="secondary" type="button" onClick={() => setSelected(item.capability_id)}>
                {copy.open}<ArrowRight className="ml-2 inline h-4 w-4" aria-hidden />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader><CardTitle>{copy.selected}</CardTitle></CardHeader>
        <CardContent>
          {active ? (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-400">Plugin</dt><dd className="break-all">{active.plugin_id} · {active.plugin_version}</dd></div>
              <div><dt className="text-slate-400">Capability</dt><dd className="break-all">{active.capability_id} · {active.capability_version}</dd></div>
              <div><dt className="text-slate-400">{copy.schema}</dt><dd>{active.schema_version}</dd></div>
              <div><dt className="text-slate-400">{copy.output}</dt><dd>{active.output_type}</dd></div>
            </dl>
          ) : <p className="text-sm text-slate-400">{copy.noSelection}</p>}
          <p className="mt-5 text-xs text-slate-500">{copy.notice}</p>
        </CardContent>
      </Card>
    </section>
  )
}
