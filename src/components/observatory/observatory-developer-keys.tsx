'use client'

import { useState, type FormEvent } from 'react'
import { buildLocalePath, type Locale } from '@/lib/observatory-i18n'
type DeveloperKeyPair = {
  application: string
  capability: string
  environment: 'production'
  app: { key: string; expiresAt: string }
  worker: { key: string; expiresAt: string }
}

const copy = {
  uk: {
    title: 'Підключення застосунку до QDIP',
    intro: 'Створіть два обмежені ключі: один для VHV через TypeScript SDK, другий — для реєстрації Python Worker. Організації існують тільки всередині QDIP.',
    create: 'Створити ключі для VHV',
    creating: 'Створення…',
    app: 'Ключ застосунку VHV',
    worker: 'Ключ Worker',
    appHint: 'Railway → @secretary/api → QDIP_API_KEY. Дозволи: plugins:read + plugins:execute.',
    workerHint: 'Railway → vhv-qdip-secretary-plan-worker → QDIP_REMOTE_API_KEY. Дозвіл: plugins:register.',
    once: 'Ключі відображаються лише один раз. Збережіть їх у відповідних Railway Variables, не в GitHub, браузерному коді чи Observatory.',
    ready: 'Після запуску Worker відкрийте керування плагінами, виберіть зареєстрований secretary і опублікуйте його.',
    publish: 'Перейти до публікації плагіна',
    copy: 'Копіювати',
    copied: 'Скопійовано',
    error: 'Не вдалося створити ключі. Перевірте права адміністратора й версію QDIP Core.',
    warning: 'Повторне створення випускає нові ключі; старі не відкликаються автоматично.',
  },
  en: {
    title: 'Connect an application to QDIP',
    intro: 'Create two restricted keys: one for the VHV TypeScript SDK and another for Python Worker registration. Organization isolation is internal to QDIP.',
    create: 'Create VHV keys',
    creating: 'Creating…',
    app: 'VHV application key',
    worker: 'Worker key',
    appHint: 'Railway → @secretary/api → QDIP_API_KEY. Permissions: plugins:read + plugins:execute.',
    workerHint: 'Railway → vhv-qdip-secretary-plan-worker → QDIP_REMOTE_API_KEY. Permission: plugins:register.',
    once: 'These keys appear only once. Save them as Railway Variables, never in GitHub, browser code, or Observatory.',
    ready: 'Once the Worker is running, open plugin administration, select the registered secretary plugin, and publish it.',
    publish: 'Open plugin publication',
    copy: 'Copy',
    copied: 'Copied',
    error: 'Unable to create keys. Check administrator access and the QDIP Core release.',
    warning: 'Creating new keys does not automatically revoke previously issued ones.',
  },
  pl: {
    title: 'Połącz aplikację z QDIP',
    intro: 'Utwórz dwa ograniczone klucze: dla TypeScript SDK VHV i do rejestracji Python Workera. Izolacja organizacji pozostaje wyłącznie w QDIP.',
    create: 'Utwórz klucze VHV',
    creating: 'Tworzenie…',
    app: 'Klucz aplikacji VHV',
    worker: 'Klucz Workera',
    appHint: 'Railway → @secretary/api → QDIP_API_KEY. Uprawnienia: plugins:read + plugins:execute.',
    workerHint: 'Railway → vhv-qdip-secretary-plan-worker → QDIP_REMOTE_API_KEY. Uprawnienie: plugins:register.',
    once: 'Klucze są widoczne tylko raz. Zapisz je jako Railway Variables, nigdy w GitHub, kodzie przeglądarki ani Observatory.',
    ready: 'Po uruchomieniu Workera otwórz zarządzanie wtyczkami, wybierz zarejestrowany plugin secretary i go opublikuj.',
    publish: 'Przejdź do publikacji',
    copy: 'Kopiuj',
    copied: 'Skopiowano',
    error: 'Nie można utworzyć kluczy. Sprawdź uprawnienia administratora i wersję QDIP Core.',
    warning: 'Nowe klucze nie unieważniają automatycznie poprzednich.',
  },
} as const

export function ObservatoryDeveloperKeys({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [keys, setKeys] = useState<DeveloperKeyPair | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'app' | 'worker' | null>(null)

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setKeys(null)
    setCopied(null)
    setError('')
    setPending(true)
    try {
      const response = await fetch('/api/observatory/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ application: 'VHV', capability: 'secretary.plan' }),
      })
      const data: unknown = await response.json()
      if (!response.ok || !data || typeof data !== 'object' || !('app' in data) || !('worker' in data))
        throw new Error((data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
          ? data.error : t.error)
      const value = data as DeveloperKeyPair
      if (typeof value.app?.key !== 'string' || typeof value.worker?.key !== 'string')
        throw new Error(t.error)
      setKeys(value)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error)
    } finally {
      setPending(false)
    }
  }

  async function copyKey(type: 'app' | 'worker') {
    const value = keys?.[type].key
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
    } catch {
      setError(t.error)
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 text-slate-100 md:px-8 md:py-12">
      <p className="text-xs uppercase tracking-widest text-slate-400">QDIP / Observatory / SDK</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t.title}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{t.intro}</p>
      <section className="mt-8 rounded-xl border border-white/15 bg-slate-900 p-5 sm:p-7">
        <div className="text-sm text-slate-300"><strong>VHV</strong> · secretary.plan · production</div>
        <form className="mt-6" onSubmit={(event) => void create(event)}>
          <button type="submit" disabled={pending}
            className="min-h-11 rounded-lg bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-50">
            {pending ? t.creating : t.create}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-400">{t.warning}</p>
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </section>
      {keys && (
        <section className="mt-8 rounded-xl border border-white/20 bg-slate-900 p-5 sm:p-7">
          <p role="status" className="mb-6 text-sm text-slate-300">{t.once}</p>
          {(['app', 'worker'] as const).map(type => (
            <div key={type} className="mb-6 grid min-w-0 gap-3">
              <h2 className="text-lg font-semibold">{type === 'app' ? t.app : t.worker}</h2>
              <p className="text-sm text-slate-400">{type === 'app' ? t.appHint : t.workerHint}</p>
              <div className="flex min-w-0 flex-wrap gap-3">
                <input readOnly aria-label={type === 'app' ? t.app : t.worker}
                  value={keys[type].key} type="password"
                  className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950 px-3 font-mono text-sm" />
                <button type="button" onClick={() => void copyKey(type)}
                  className="min-h-11 rounded-lg border border-white/25 px-4 text-sm">
                  {copied === type ? t.copied : t.copy}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}
      <section className="mt-8 border-t border-white/15 pt-6">
        <p className="text-sm leading-7 text-slate-300">{t.ready}</p>
        <a href={buildLocalePath('/admin/plugins', locale)}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-slate-200 underline underline-offset-4">
          {t.publish} →
        </a>
      </section>
    </main>
  )
}
