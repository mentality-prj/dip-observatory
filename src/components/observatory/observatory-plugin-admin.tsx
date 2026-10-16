'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge, Button } from '@/design-system'
import type { Locale } from '@/lib/observatory-i18n'
import { DIP_USE_CASES } from '@/use-cases/registry'

type Row = {
  name: string
  description: string
  version: string
  enabled: boolean
  capabilities: string[]
  published: boolean | null
  published_version: string | null
  capability_id: string | null
  revision: number
  ui: { label?: string; category?: string }
}

const legacy = new Set([
  'resource-allocation',
  'supply-network-optimization',
  'contractor-allocation',
  'readiness-recovery',
  'gtm-lab',
])

const copy = {
  uk: {
    title: 'Керування плагінами',
    subtitle:
      'Додавайте до Observatory лише перевірені плагіни з чинного QDIP Core. Код, організації та ключі тут не налаштовуються.',
    reload: 'Оновити',
    loading: 'Завантаження реєстру…',
    none: 'У QDIP Core немає зареєстрованих плагінів.',
    available: 'Підготовлений',
    published: 'Опублікований',
    disabled: 'Вимкнений',
    missing: 'Немає сторінки Observatory',
    add: 'Додати до Observatory',
    remove: 'Прибрати з Observatory',
    working: 'Збереження…',
    version: 'Версія',
    capability: 'Можливість',
    noAccess: 'Немає доступу або QDIP Core недоступний.',
    reloadConflict: 'Стан змінився. Онови список.',
    info: 'Додавання публікує наявну сторінку. Воно не встановлює код та не надає право виконувати плагін.',
  },
  en: {
    title: 'Manage plugins',
    subtitle:
      'Publish only verified plugins from the existing QDIP Core registry. No code, organizations or keys are managed here.',
    reload: 'Refresh',
    loading: 'Loading registry…',
    none: 'No plugins registered in QDIP Core.',
    available: 'Ready',
    published: 'Published',
    disabled: 'Disabled',
    missing: 'No Observatory workspace',
    add: 'Add to Observatory',
    remove: 'Remove from Observatory',
    working: 'Saving…',
    version: 'Version',
    capability: 'Capability',
    noAccess: 'Access denied or QDIP Core unavailable.',
    reloadConflict: 'Registry changed. Reload.',
    info: 'Publishing exposes an existing application page. It never installs code or grants execution permissions.',
  },
  pl: {
    title: 'Zarządzanie wtyczkami',
    subtitle: 'Publikuj tylko sprawdzone wtyczki z QDIP Core. Bez konfiguracji kodu, organizacji lub kluczy.',
    reload: 'Odśwież',
    loading: 'Ładowanie rejestru…',
    none: 'Brak zarejestrowanych wtyczek.',
    available: 'Gotowa',
    published: 'Opublikowana',
    disabled: 'Wyłączona',
    missing: 'Brak strony Observatory',
    add: 'Dodaj do Observatory',
    remove: 'Usuń z Observatory',
    working: 'Zapisywanie…',
    version: 'Wersja',
    capability: 'Możliwość',
    noAccess: 'Brak dostępu lub QDIP Core jest niedostępny.',
    reloadConflict: 'Rejestr uległ zmianie. Odśwież.',
    info: 'Publikacja udostępnia istniejącą stronę. Nie instaluje kodu ani nie nadaje uprawnień wykonania.',
  },
} as const

export function ObservatoryPluginAdmin({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/observatory/admin/plugins', { cache: 'no-store' })
      if (!response.ok) throw new Error(String(response.status))
      const data = (await response.json()) as { plugins?: Row[] }
      if (!Array.isArray(data.plugins)) throw new Error('Invalid response')
      setRows(data.plugins)
      setError('')
    } catch {
      setError(t.noAccess)
    }
  }, [t.noAccess])

  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/observatory/admin/plugins', { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status))
        return response.json() as Promise<{ plugins?: Row[] }>
      })
      .then((data) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(data.plugins)) throw new Error('Invalid response')
        setRows(data.plugins)
        setError('')
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t.noAccess)
      })
    return () => controller.abort()
  }, [t.noAccess])

  async function save(row: Row, published: boolean) {
    setPending(row.name)
    setError('')
    try {
      const response = await fetch('/api/observatory/admin/plugins/' + encodeURIComponent(row.name), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published, expected_revision: row.revision }),
      })
      if (!response.ok) throw new Error(response.status === 409 ? t.reloadConflict : t.noAccess)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.noAccess)
    } finally {
      setPending(null)
    }
  }

  const listed = [...(rows ?? [])].sort(
    (a, b) =>
      Number(Boolean(DIP_USE_CASES.find((item) => item.plugin.id === b.name))) -
        Number(Boolean(DIP_USE_CASES.find((item) => item.plugin.id === a.name))) || a.name.localeCompare(b.name)
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 text-slate-100 md:px-8 md:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-300">QDIP / Observatory / Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{t.subtitle}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => void refresh()} disabled={pending !== null}>
          {t.reload}
        </Button>
      </div>
      {error && (
        <p className="mt-6 rounded-lg border border-rose-500/50 px-4 py-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      )}
      {!rows && !error && (
        <p className="mt-6" role="status">
          {t.loading}
        </p>
      )}
      {rows?.length === 0 && <p className="mt-6">{t.none}</p>}
      <div className="mt-8 grid gap-4">
        {listed.map((row) => {
          const workspace = DIP_USE_CASES.find(
            (item) => item.plugin.id === row.name && row.capabilities.includes(item.plugin.capability)
          )
          const isPublished =
            row.published === null
              ? Boolean(workspace && legacy.has(workspace.id))
              : row.published &&
                row.version === row.published_version &&
                row.capability_id === workspace?.plugin.capability
          const canPublish = Boolean(row.enabled && workspace)
          const busy = pending === row.name
          return (
            <article key={row.name} className="rounded-xl border border-white/15 bg-slate-900/50 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{row.ui?.label || row.name}</h2>
                  <p className="mt-1 break-all text-xs text-slate-500">{row.name}</p>
                  {row.description && <p className="mt-3 text-sm leading-6 text-slate-400">{row.description}</p>}
                </div>
                <Badge variant={isPublished ? 'emerald' : 'neutral'}>
                  {isPublished ? t.published : !row.enabled ? t.disabled : workspace ? t.available : t.missing}
                </Badge>
              </div>
              <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-400">
                <div>
                  <dt>{t.version}</dt>
                  <dd className="mt-1 text-slate-200">{row.version}</dd>
                </div>
                <div>
                  <dt>{t.capability}</dt>
                  <dd className="mt-1 break-all text-slate-200">{workspace?.plugin.capability ?? '—'}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <Button
                  type="button"
                  variant={isPublished ? 'secondary' : 'default'}
                  disabled={busy || pending !== null || (!isPublished && !canPublish)}
                  onClick={() => void save(row, !isPublished)}
                >
                  {busy ? t.working : isPublished ? t.remove : t.add}
                </Button>
              </div>
            </article>
          )
        })}
      </div>
      <p className="mt-6 text-xs leading-6 text-slate-500">{t.info}</p>
    </main>
  )
}
