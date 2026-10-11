import type { Locale } from '@/lib/observatory-i18n'

/**
 * Public, read-only description of the invented civilian workshop fixture in
 * qdip-core/app/plugins/readiness_recovery/reference_fixture.py.
 * This is INPUT, never a predicted schedule, a Kernel execution or a claim of ROI.
 */
const fixture = [
  { id: 'diagnostic-check', skills: 'diagnostics', slots: '1', dependency: '—' },
  { id: 'filter-replacement', skills: 'mechanical', slots: '1', dependency: 'diagnostic-check' },
  { id: 'safety-cable-check', skills: 'electrical', slots: '1', dependency: '—' },
  { id: 'sensor-service', skills: 'electrical', slots: '2', dependency: 'safety-cable-check' },
] as const

const copy = {
  en: {
    eyebrow: 'Public civilian example · input only',
    title: 'How would you restore four service jobs with limited resources?',
    intro: 'A small invented workshop has three qualified technicians, two concurrent workshop positions, a limited parts inventory and dependent maintenance tasks. The Kernel must respect these constraints when it produces a schedule.',
    resources: 'Scenario inputs',
    technicians: '3 technicians',
    capacity: '2 workshop positions',
    inventory: 'One scarce sensor fuse supplied by a donor kit',
    jobs: 'Maintenance tasks',
    task: 'Task',
    skill: 'Required skill',
    duration: 'Duration, slots',
    depends: 'Depends on',
    next: 'What can the operator verify?',
    flow: 'Validate source → Run Kernel → Review scheduled jobs → Replan → Audit and replay',
    boundary: 'This table describes an invented input fixture, not a calculated plan. No schedule, forecast, benchmark advantage or real customer outcome is asserted. Live results are available only through the authorized Kernel operator.',
  },
  uk: {
    eyebrow: 'Публічний цивільний приклад · лише вхідні дані',
    title: 'Як виконати чотири ремонтні роботи за обмежених ресурсів?',
    intro: 'У вигаданій майстерні є три спеціалісти, два одночасні робочі місця, обмежений запас деталей та залежні ремонтні операції. Kernel враховує ці обмеження під час створення розкладу.',
    resources: 'Умови сценарію',
    technicians: '3 спеціалісти',
    capacity: '2 робочі місця',
    inventory: 'Дефіцитний запобіжник із донорського комплекту',
    jobs: 'Ремонтні роботи',
    task: 'Робота',
    skill: 'Кваліфікація',
    duration: 'Тривалість, слоти',
    depends: 'Залежить від',
    next: 'Що може перевірити оператор?',
    flow: 'Перевірка джерела → Kernel → План робіт → Перепланування → Аудит і replay',
    boundary: 'Таблиця описує вигадані вхідні дані, а не обчислений план. Розклад, прогноз, перевага над конкурентами й результати реального клієнта не заявляються. Фактичні рішення доступні лише авторизованому оператору Kernel.',
  },
  pl: {
    eyebrow: 'Publiczny przykład cywilny · tylko dane wejściowe',
    title: 'Jak wykonać cztery prace serwisowe przy ograniczonych zasobach?',
    intro: 'W fikcyjnym warsztacie pracuje trzech techników, są dwa stanowiska, ograniczone części i zależności między pracami. Kernel respektuje te ograniczenia przy tworzeniu harmonogramu.',
    resources: 'Warunki scenariusza',
    technicians: '3 techników',
    capacity: '2 stanowiska',
    inventory: 'Rzadki bezpiecznik z zestawu dawcy',
    jobs: 'Zadania serwisowe',
    task: 'Zadanie',
    skill: 'Umiejętność',
    duration: 'Czas, sloty',
    depends: 'Zależność',
    next: 'Co może sprawdzić operator?',
    flow: 'Weryfikacja danych → Kernel → Harmonogram → Zmiana planu → Audyt i replay',
    boundary: 'Tabela przedstawia fikcyjne dane wejściowe, nie wynik optymalizacji. Nie deklarujemy harmonogramu, prognozy, przewagi konkurencyjnej ani efektów u klienta. Wyniki Kernel są dostępne tylko dla uprawnionego operatora.',
  },
} as const

export function KernelReferencePreview({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <section
      aria-label={t.title}
      data-testid="rr-reference-preview"
      className="mt-6 border border-white/15 bg-white/[.025] p-5 md:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">{t.eyebrow}</p>
      <h2 className="mt-3 text-xl font-semibold text-white md:text-2xl">{t.title}</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-300">{t.intro}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3" aria-label={t.resources}>
        {[t.technicians, t.capacity, t.inventory].map((item) => (
          <div key={item} className="border border-white/15 bg-slate-900/40 p-3 text-sm text-slate-200">{item}</div>
        ))}
      </div>
      <h3 className="mt-6 text-base font-semibold">{t.jobs}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-white/15">
              <th scope="col" className="py-2 pr-3">{t.task}</th>
              <th scope="col" className="py-2 pr-3">{t.skill}</th>
              <th scope="col" className="py-2 pr-3">{t.duration}</th>
              <th scope="col" className="py-2">{t.depends}</th>
            </tr>
          </thead>
          <tbody>
            {fixture.map((job) => (
              <tr key={job.id} className="border-b border-white/10 text-slate-200">
                <td className="py-2 pr-3 font-mono text-xs">{job.id}</td>
                <td className="py-2 pr-3">{job.skills}</td>
                <td className="py-2 pr-3">{job.slots}</td>
                <td className="py-2 font-mono text-xs">{job.dependency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="mt-5 text-sm font-semibold">{t.next}</h3>
      <p className="mt-2 text-sm text-slate-200">{t.flow}</p>
      <p className="mt-4 border-t border-white/15 pt-3 text-xs leading-6 text-amber-200">{t.boundary}</p>
    </section>
  )
}
