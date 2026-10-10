import type { Locale } from '@/lib/observatory-i18n'
import {
  RR_WIDGET_CATALOG,
  templatePreferences,
  toggleRRWidget,
  type RRViewPreferences,
  type RRViewTemplate,
  type RRWidget,
} from './view-preferences'

const copy = {
  en: {
    title: 'Personal Observatory',
    template: 'View template',
    reset: 'Reset layout',
    density: 'Density',
    compact: 'Compact',
    comfortable: 'Comfortable',
    widgets: 'Visible widgets',
    note: 'Only display preferences are saved on this device. Input data, decisions and credentials are never stored.',
    names: {
      DECISION_SUMMARY: 'Decision summary',
      ALTERNATIVES: 'Alternatives',
      EVIDENCE: 'Analyst evidence',
      BASELINES: 'Heuristic baselines',
      DIAGNOSTICS: 'Technical diagnostics',
    },
    templates: { BUSINESS: 'Business', ANALYST: 'Analyst', COMPACT: 'Quick review' },
  },
  uk: {
    title: 'Моя Observatory',
    template: 'Шаблон вигляду',
    reset: 'Скинути вигляд',
    density: 'Щільність',
    compact: 'Компактно',
    comfortable: 'Звичайно',
    widgets: 'Віджети',
    note: 'На пристрої зберігаються лише налаштування відображення. Дані, рішення та ключі не зберігаються.',
    names: {
      DECISION_SUMMARY: 'Підсумок рішення',
      ALTERNATIVES: 'Альтернативи',
      EVIDENCE: 'Докази аналітика',
      BASELINES: 'Евристичні альтернативи',
      DIAGNOSTICS: 'Технічна діагностика',
    },
    templates: { BUSINESS: 'Бізнес', ANALYST: 'Аналітик', COMPACT: 'Швидкий огляд' },
  },
  pl: {
    title: 'Moje Observatory',
    template: 'Szablon widoku',
    reset: 'Zresetuj widok',
    density: 'Gęstość',
    compact: 'Kompaktowy',
    comfortable: 'Standardowy',
    widgets: 'Widoczne moduły',
    note: 'Na urządzeniu przechowujemy wyłącznie ustawienia widoku, nigdy danych wejściowych, decyzji ani kluczy.',
    names: {
      DECISION_SUMMARY: 'Podsumowanie',
      ALTERNATIVES: 'Warianty',
      EVIDENCE: 'Dowody analityczne',
      BASELINES: 'Heurystyki',
      DIAGNOSTICS: 'Diagnostyka techniczna',
    },
    templates: { BUSINESS: 'Biznes', ANALYST: 'Analityk', COMPACT: 'Szybki przegląd' },
  },
} as const

export function PersonalObservatory({
  locale,
  value,
  onChange,
}: {
  locale: Locale
  value: RRViewPreferences
  onChange: (next: RRViewPreferences) => void
}) {
  const t = copy[locale]
  return (
    <section data-testid="rr-personal-observatory" className="mt-5 border border-white/10 bg-white/[.025] p-5">
      <h2 className="text-lg font-medium">{t.title}</h2>
      <div className="mt-4 flex flex-wrap gap-4">
        <label className="text-xs text-slate-300">
          {t.template}
          <select
            className="mt-2 block border border-white/15 bg-slate-950 p-2 text-sm"
            value={value.template}
            onChange={(e) => onChange(templatePreferences(e.target.value as RRViewTemplate))}
          >
            {(['BUSINESS', 'ANALYST', 'COMPACT'] as const).map((key) => (
              <option key={key} value={key}>
                {t.templates[key]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          {t.density}
          <select
            className="mt-2 block border border-white/15 bg-slate-950 p-2 text-sm"
            value={value.density}
            onChange={(e) => onChange({ ...value, density: e.target.value as RRViewPreferences['density'] })}
          >
            <option value="COMFORTABLE">{t.comfortable}</option>
            <option value="COMPACT">{t.compact}</option>
          </select>
        </label>
        <button
          type="button"
          className="self-end border border-white/15 px-3 py-2 text-sm text-slate-300"
          onClick={() => onChange(templatePreferences('BUSINESS'))}
        >
          {t.reset}
        </button>
      </div>
      <fieldset className="mt-4">
        <legend className="text-xs text-slate-300">{t.widgets}</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
          {RR_WIDGET_CATALOG.map((widget: RRWidget) => (
            <label key={widget} className="inline-flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={value.widgets.includes(widget)}
                onChange={() => onChange(toggleRRWidget(value, widget))}
              />
              {t.names[widget]}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="mt-4 text-xs text-slate-500">{t.note}</p>
    </section>
  )
}
