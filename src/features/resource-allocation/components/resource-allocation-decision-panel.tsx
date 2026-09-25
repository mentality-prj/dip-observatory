'use client'

import { useState } from 'react'
import { Clipboard, Download } from 'lucide-react'
import type { Locale } from '@/lib/observatory-i18n'
import type { EvaluatedManualAllocation } from '../contracts'
import { trackResourceAllocation } from '../presentation'

type Props = {
  input: Record<string, unknown>
  selected: Record<string, unknown>
  manualSelected?: EvaluatedManualAllocation | null
  priorityCoverage: number
  served: number
  unmet: number
  teamsMoved: number
  totalTeams: number
  moveEvents: number
  planningDays: number
  planCsv?: string
  planShortText?: string
  exportFileName?: string
  selectionKind?: 'recommended' | 'alternative'
  locale?: Locale
}

const copy = {
  uk: {
    capacity: 'ЧОГО БРАКУЄ ДЛЯ КРАЩОГО РЕЗУЛЬТАТУ',
    capacityTitle: 'Яких ресурсів бракує, щоб досягти бажаного покриття?',
    analyze: 'Розрахувати необхідні ресурси',
    analyzing: 'Розрахунок…',
    infeasible: 'Для поточної операційної ситуації неможливо виконати аналіз доступної потужності.',
    gap: 'До цілі бракує',
    status: 'Стан',
    reached: 'Ціль досягнута',
    gapStatus: 'Є дефіцит',
    already: 'Поточне покриття вже досягає обраної цілі. Додаткові ресурси не потрібні.',
    notEnough:
      'Протестованого збільшення ресурсів недостатньо для обраної цілі. Нижче показані обмеження, які стримують результат.',
    additions: 'Мінімальні протестовані додаткові ресурси для досягнення цілі',
    teamEq: 'екв. команди',
    capacityUnit: 'потужності',
    priority: 'Пріоритетне покриття',
    improvement: 'покращення',
    bottlenecks: 'Критичні дефіцити за послугами',
    demand: 'пріоритетний попит',
    available: 'доступна потужність',
    shortfall: 'дефіцит',
    firstTeam: 'від першого екв. команди',
    decision: 'ПЛАН QDIP',
    decisionTitle: 'Готовий план для використання',
    staged: 'Показано ваш змінений план.',
    snapshot: 'Зафіксувати рішення',
    snapshotBusy: 'Фіксую рішення…',
    decisionId: 'ID рішення',
    reason: 'Обґрунтування зміни або відхилення',
    accept: 'Прийняти рекомендацію QDIP',
    modify: 'Прийняти ручне коригування',
    alternative: 'Прийняти вибраний альтернативний план',
    reject: 'Відхилити рекомендацію',
    outcomeNotes: 'Що відбулося фактично після виконання рішення',
    record: 'Зафіксувати фактичний результат',
    recording: 'Збереження…',
    completed: 'Рішення завершено.',
    completedText: 'QDIP зберіг рекомендацію, рішення менеджера та фактичний результат в одній історії рішення.',
    timeline: 'ІСТОРІЯ РІШЕННЯ',
    proposed: 'Рекомендацію зафіксовано',
    actual: 'Фактичний результат зафіксовано',
    actor: 'виконавець',
    engine: 'Версії',
    refresh: 'Оновити історію',
    target: 'Бажане покриття пріоритетних потреб',
    currentCoverage: 'Поточне покриття',
    decisionHelp:
      'Оберіть план, який буде виконуватися. QDIP автоматично збереже стан даних, рекомендацію та ваше рішення.',
    outcome: 'ФАКТИЧНИЙ РЕЗУЛЬТАТ',
    outcomeTitle: 'Що сталося після виконання плану?',
    outcomeHelp: 'Внесіть фактичні показники. QDIP не підмінює факт прогнозом.',
    actualCoverage: 'Фактичне покриття пріоритетних потреб, %',
    actualServed: 'Фактично покрито одиниць потреб',
    actualUnmet: 'Фактично залишилось непокрито',
    expected: 'Очікування QDIP',
    decisionCoverage: 'Покриття пріоритетних потреб',
    decisionServed: 'Покрито за період',
    decisionUnmet: 'Залишиться непокрито',
    decisionMoved: 'Команд змінять локацію',
    decisionMoveEvents: 'Переміщень за період',
    modifyReason: 'Чому ви змінили рекомендацію?',
    rejectReason: 'Чому рекомендація не підходить?',
    confirmModify: 'Підтвердити мій варіант',
    confirmReject: 'Підтвердити відхилення',
    approved: 'План затверджено',
    nextStep: 'Наступний крок — передати план координаторам команд.',
    exportCsv: 'Завантажити план CSV',
    copyPlan: 'Скопіювати короткий план',
    copied: 'План скопійовано',
    afterExecution: 'Після виконання плану',
    importActual: 'Імпортувати фактичний тиждень',
    importingActual: 'Оцінюю фактичний тиждень…',
    actualImported: 'Фактичний тиждень оцінено',
    actualImportHelp:
      'Завантажте той самий pilot-format із фактичними потребами та baseline rows як реально виконаними призначеннями. QDIP розрахує фактичні KPI замість ручного введення.',
    technicalHistory: 'Технічні деталі історії',
    forecast: 'Прогноз QDIP',
    actualValue: 'Факт',
  },
  en: {
    capacity: 'WHAT IS NEEDED FOR A BETTER RESULT',
    capacityTitle: 'What resources are needed to reach the coverage you want?',
    analyze: 'Calculate required resources',
    analyzing: 'Analyzing…',
    infeasible: 'Capacity analysis is infeasible for the current operational state.',
    gap: 'Gap to target',
    status: 'Status',
    reached: 'Target reached',
    gapStatus: 'Capacity gap',
    already: 'Current coverage already meets the selected target. No additional capacity is required.',
    notEnough: 'The tested resource additions do not reach the selected target. Review the binding constraints below.',
    additions: 'Minimum tested additions that reach the target',
    teamEq: 'team eq.',
    capacityUnit: 'capacity',
    priority: 'Priority coverage',
    improvement: 'improvement',
    bottlenecks: 'Binding service bottlenecks',
    demand: 'priority demand',
    available: 'available capacity',
    shortfall: 'shortfall',
    firstTeam: 'from first team eq.',
    decision: 'QDIP PLAN',
    decisionTitle: 'Plan ready to use',
    staged: 'Your modified plan is shown.',
    snapshot: 'Record decision',
    snapshotBusy: 'Recording decision…',
    decisionId: 'Decision ID',
    reason: 'Reason for modification or rejection',
    accept: 'Accept QDIP recommendation',
    modify: 'Approve manual modification',
    alternative: 'Accept selected alternative plan',
    reject: 'Reject recommendation',
    outcomeNotes: 'What actually happened after the decision was executed',
    record: 'Record actual outcome',
    recording: 'Recording…',
    completed: 'Decision completed.',
    completedText: 'QDIP stored the recommendation, manager decision and actual outcome in one decision history.',
    timeline: 'DECISION HISTORY',
    proposed: 'Recommendation captured',
    actual: 'Actual outcome recorded',
    actor: 'actor',
    engine: 'Versions',
    refresh: 'Refresh history',
    target: 'Desired priority-needs coverage',
    currentCoverage: 'Current coverage',
    decisionHelp:
      'Choose the plan that will be executed. QDIP automatically stores the data state, recommendation and your decision.',
    outcome: 'ACTUAL RESULT',
    outcomeTitle: 'What happened after the plan was executed?',
    outcomeHelp: 'Enter the actual results. QDIP does not substitute the forecast for the observed outcome.',
    actualCoverage: 'Actual priority-needs coverage, %',
    actualServed: 'Demand units actually covered',
    actualUnmet: 'Demand units actually left uncovered',
    expected: 'QDIP expectation',
    decisionCoverage: 'Priority-needs coverage',
    decisionServed: 'Covered over the horizon',
    decisionUnmet: 'Expected uncovered',
    decisionMoved: 'Teams changing location',
    decisionMoveEvents: 'Move events over the horizon',
    modifyReason: 'Why did you change the recommendation?',
    rejectReason: 'Why is the recommendation not suitable?',
    confirmModify: 'Confirm my plan',
    confirmReject: 'Confirm rejection',
    approved: 'Plan approved',
    nextStep: 'Next step — share the approved plan with team coordinators.',
    exportCsv: 'Download plan CSV',
    copyPlan: 'Copy short plan',
    copied: 'Plan copied',
    afterExecution: 'After the plan is executed',
    importActual: 'Import actual week',
    importingActual: 'Evaluating actual week…',
    actualImported: 'Actual week evaluated',
    actualImportHelp:
      'Upload the same pilot format with observed demand and baseline rows as the assignments actually executed. QDIP will calculate actual KPIs instead of requiring manual entry.',
    technicalHistory: 'Technical history details',
    forecast: 'QDIP forecast',
    actualValue: 'Actual',
  },
  pl: {
    capacity: 'CZEGO BRAKUJE DO LEPSZEGO WYNIKU',
    capacityTitle: 'Jakich zasobów potrzeba, aby osiągnąć oczekiwane pokrycie?',
    analyze: 'Oblicz wymagane zasoby',
    analyzing: 'Analiza…',
    infeasible: 'Dla bieżącej sytuacji operacyjnej nie można wykonać analizy dostępnej zdolności.',
    gap: 'Brak do celu',
    status: 'Stan',
    reached: 'Cel osiągnięty',
    gapStatus: 'Deficyt zasobów',
    already: 'Bieżące pokrycie już osiąga wybrany cel. Dodatkowe zasoby nie są wymagane.',
    notEnough:
      'Testowane zwiększenie zasobów nie osiąga wybranego celu. Poniżej pokazano ograniczenia blokujące wynik.',
    additions: 'Minimalne testowane dodatkowe zasoby potrzebne do osiągnięcia celu',
    teamEq: 'ekw. zespołu',
    capacityUnit: 'zdolności',
    priority: 'Pokrycie priorytetów',
    improvement: 'poprawa',
    bottlenecks: 'Krytyczne deficyty według usług',
    demand: 'popyt priorytetowy',
    available: 'dostępna zdolność',
    shortfall: 'deficyt',
    firstTeam: 'od pierwszego ekw. zespołu',
    decision: 'PLAN QDIP',
    decisionTitle: 'Plan gotowy do użycia',
    staged: 'Wyświetlono Twój zmodyfikowany plan.',
    snapshot: 'Zapisz decyzję',
    snapshotBusy: 'Zapisywanie decyzji…',
    decisionId: 'ID decyzji',
    reason: 'Uzasadnienie zmiany lub odrzucenia',
    accept: 'Zaakceptuj rekomendację QDIP',
    modify: 'Zaakceptuj korektę ręczną',
    alternative: 'Zaakceptuj wybrany wariant alternatywny',
    reject: 'Odrzuć rekomendację',
    outcomeNotes: 'Co faktycznie wydarzyło się po wykonaniu decyzji',
    record: 'Zapisz rzeczywisty wynik',
    recording: 'Zapisywanie…',
    completed: 'Decyzja zakończona.',
    completedText: 'QDIP zapisał rekomendację, decyzję menedżera i rzeczywisty wynik w jednej historii decyzji.',
    timeline: 'HISTORIA DECYZJI',
    proposed: 'Rekomendacja zapisana',
    actual: 'Wynik rzeczywisty zapisany',
    actor: 'wykonawca',
    engine: 'Wersje',
    refresh: 'Odśwież historię',
    target: 'Docelowe pokrycie potrzeb priorytetowych',
    currentCoverage: 'Bieżące pokrycie',
    decisionHelp:
      'Wybierz plan, który ma zostać wykonany. QDIP automatycznie zapisze stan danych, rekomendację i Twoją decyzję.',
    outcome: 'WYNIK RZECZYWISTY',
    outcomeTitle: 'Co wydarzyło się po wykonaniu planu?',
    outcomeHelp: 'Wprowadź rzeczywiste wyniki. QDIP nie zastępuje faktu prognozą.',
    actualCoverage: 'Rzeczywiste pokrycie potrzeb priorytetowych, %',
    actualServed: 'Rzeczywiście pokryte jednostki potrzeb',
    actualUnmet: 'Rzeczywiście niepokryte jednostki potrzeb',
    expected: 'Oczekiwanie QDIP',
    decisionCoverage: 'Pokrycie potrzeb priorytetowych',
    decisionServed: 'Pokryte w całym horyzoncie',
    decisionUnmet: 'Oczekiwane niepokryte',
    decisionMoved: 'Zespoły zmieniające lokalizację',
    decisionMoveEvents: 'Przemieszczenia w całym horyzoncie',
    modifyReason: 'Dlaczego zmieniasz rekomendację?',
    rejectReason: 'Dlaczego rekomendacja nie pasuje?',
    confirmModify: 'Potwierdź mój wariant',
    confirmReject: 'Potwierdź odrzucenie',
    approved: 'Plan zatwierdzony',
    nextStep: 'Następny krok — przekaż zatwierdzony plan koordynatorom zespołów.',
    exportCsv: 'Pobierz plan CSV',
    copyPlan: 'Kopiuj krótki plan',
    copied: 'Plan skopiowany',
    afterExecution: 'Po wykonaniu planu',
    importActual: 'Importuj rzeczywisty tydzień',
    importingActual: 'Oceniam rzeczywisty tydzień…',
    actualImported: 'Rzeczywisty tydzień oceniony',
    actualImportHelp:
      'Wczytaj ten sam format pilotażowy z rzeczywistym popytem i wierszami baseline jako faktycznie wykonanymi przydziałami. QDIP obliczy rzeczywiste KPI zamiast ręcznego wprowadzania.',
    technicalHistory: 'Techniczne szczegóły historii',
    forecast: 'Prognoza QDIP',
    actualValue: 'Fakt',
  },
} as const

export function ResourceAllocationDecisionPanel({
  manualSelected,
  priorityCoverage,
  served,
  unmet,
  teamsMoved,
  totalTeams,
  moveEvents,
  planningDays,
  planCsv,
  planShortText,
  exportFileName,
  locale = 'uk',
}: Props) {
  const t = copy[locale]
  const [copied, setCopied] = useState(false)

  function downloadPlan() {
    if (!planCsv || typeof document === 'undefined') return
    const blob = new Blob([planCsv], { type: 'text/csv;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = exportFileName ?? 'qdip-resource-allocation.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(href)
    trackResourceAllocation('ra_plan_exported', locale)
  }

  async function copyPlan() {
    if (!planShortText || !navigator.clipboard) return
    await navigator.clipboard.writeText(planShortText)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
    trackResourceAllocation('ra_plan_exported', locale)
  }

  return (
    <div className="grid min-w-0 max-w-full gap-5">
      <section className="order-1 min-w-0 max-w-full overflow-hidden rounded-[var(--ds-radius-panel)] border border-white/10 bg-white/[0.04] p-6">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-300">06 · {t.decision}</div>
        <h3 className="mt-2 text-xl font-medium">{manualSelected ? t.staged : t.decisionTitle}</h3>
        <p className="mt-4 max-w-2xl text-sm text-slate-400">{t.decisionHelp}</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-5" data-testid="decision-summary">
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionCoverage}</div>
            <b className="mt-1 block text-xl">{Math.round(priorityCoverage * 100)}%</b>
          </div>
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionServed}</div>
            <b className="mt-1 block text-xl">{served.toFixed(0)}</b>
          </div>
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionUnmet}</div>
            <b className="mt-1 block text-xl">{unmet.toFixed(0)}</b>
          </div>
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionMoved}</div>
            <b className="mt-1 block text-xl">
              {teamsMoved} / {totalTeams}
            </b>
          </div>
          <div className="border border-white/10 p-3">
            <div className="text-xs text-slate-500">{t.decisionMoveEvents}</div>
            <b className="mt-1 block text-xl">{moveEvents}</b>
            <div className="mt-1 text-[10px] text-slate-600">
              {planningDays} {locale === 'uk' ? 'днів' : locale === 'pl' ? 'dni' : 'days'}
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {planCsv && (
            <button
              type="button"
              onClick={downloadPlan}
              className="inline-flex items-center gap-2 bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950"
            >
              <Download className="h-4 w-4" />
              {t.exportCsv}
            </button>
          )}
          {planShortText && (
            <button
              type="button"
              onClick={() => void copyPlan()}
              className="inline-flex items-center gap-2 border border-white/15 px-4 py-3 text-sm font-bold"
            >
              <Clipboard className="h-4 w-4" />
              {copied ? t.copied : t.copyPlan}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
