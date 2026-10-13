'use client'

import { useState } from 'react'
import { ArrowUpRight, Check, CircleDot, GitBranch, LockKeyhole, SlidersHorizontal } from 'lucide-react'
import { observatoryHref } from '@/lib/platform-urls'
import type { MarketingLocale } from './qdip-copy'
import styles from './decision-workbench-preview.module.css'

const copy = {
  en: {
    title: 'Decision workspace',
    sample: 'Illustrative scenario · Local preview',
    resource: 'Resource allocation',
    stages: ['Context', 'Constraints', 'Evaluation', 'Evidence'],
    inputs: '01 / Inputs',
    budget: 'Available budget',
    requests: 'Requests',
    priority: 'Priority',
    urgent: 'Urgent need',
    rules: '02 / Decision model',
    objective: 'objective: priority_coverage',
    budgetRule: 'total_cost <= budget',
    eligibleRule: 'eligible(request) == true',
    codeLabel: 'Conceptual model · not executable code',
    evaluation: '03 / Evaluation',
    recommendation: 'Recommended allocation',
    coverage: 'requests funded',
    outcomeLow: 'Fund 5 highest-priority requests',
    outcomeHigh: 'Fund 8 highest-priority requests',
    rationale: '04 / Explainability',
    whyLow: 'Budget limits the number of eligible requests that can be funded.',
    whyHigh: 'A higher budget makes three more eligible requests feasible.',
    gate: 'A human approves the final decision',
    inspect: 'Open the working Resource Allocation demo',
    none: 'Example data, not a live QDIP execution',
  },
  uk: {
    title: 'Робочий простір рішень',
    sample: 'Приклад сценарію · Локальна демонстрація',
    resource: 'Розподіл ресурсів',
    stages: ['Контекст', 'Обмеження', 'Оцінювання', 'Докази'],
    inputs: '01 / Вхідні дані',
    budget: 'Доступний бюджет',
    requests: 'Заявки',
    priority: 'Пріоритет',
    urgent: 'Нагальна потреба',
    rules: '02 / Модель рішення',
    objective: 'objective: priority_coverage',
    budgetRule: 'total_cost <= budget',
    eligibleRule: 'eligible(request) == true',
    codeLabel: 'Концептуальна модель · не виконуваний код',
    evaluation: '03 / Оцінювання',
    recommendation: 'Рекомендований розподіл',
    coverage: 'заявок профінансовано',
    outcomeLow: 'Профінансувати 5 найпріоритетніших заявок',
    outcomeHigh: 'Профінансувати 8 найпріоритетніших заявок',
    rationale: '04 / Пояснення',
    whyLow: 'Бюджет обмежує кількість допустимих заявок, які можна профінансувати.',
    whyHigh: 'Збільшення бюджету дозволяє профінансувати ще три допустимі заявки.',
    gate: 'Остаточне рішення затверджує людина',
    inspect: 'Відкрити робоче демо Resource Allocation',
    none: 'Приклад даних, не реальний запуск QDIP',
  },
  pl: {
    title: 'Przestrzeń robocza decyzji',
    sample: 'Scenariusz przykładowy · Podgląd lokalny',
    resource: 'Alokacja zasobów',
    stages: ['Kontekst', 'Ograniczenia', 'Ocena', 'Dowody'],
    inputs: '01 / Dane wejściowe',
    budget: 'Dostępny budżet',
    requests: 'Wnioski',
    priority: 'Priorytet',
    urgent: 'Pilna potrzeba',
    rules: '02 / Model decyzji',
    objective: 'objective: priority_coverage',
    budgetRule: 'total_cost <= budget',
    eligibleRule: 'eligible(request) == true',
    codeLabel: 'Model koncepcyjny · nie kod wykonywalny',
    evaluation: '03 / Ocena',
    recommendation: 'Rekomendowany przydział',
    coverage: 'wniosków sfinansowanych',
    outcomeLow: 'Sfinansuj 5 wniosków o najwyższym priorytecie',
    outcomeHigh: 'Sfinansuj 8 wniosków o najwyższym priorytecie',
    rationale: '04 / Wyjaśnienie',
    whyLow: 'Budżet ogranicza liczbę kwalifikujących się wniosków możliwych do sfinansowania.',
    whyHigh: 'Większy budżet umożliwia sfinansowanie trzech dodatkowych kwalifikujących się wniosków.',
    gate: 'Ostateczną decyzję zatwierdza człowiek',
    inspect: 'Otwórz działające demo Resource Allocation',
    none: 'Przykładowe dane, a nie rzeczywiste uruchomienie QDIP',
  },
} as const

export function DecisionWorkbenchPreview({ locale }: { locale: MarketingLocale }) {
  const [budget, setBudget] = useState<40 | 70>(40)
  const funded = budget === 40 ? 5 : 8
  const l = copy[locale]

  return (
    <div className={styles.console} data-testid="decision-workbench">
      <div className={styles.chrome}>
        <div className={styles.brand}>
          <span className={styles.identity}>QDIP</span>
          <span className={styles.separator}>/</span>
          <span>{l.title}</span>
        </div>
        <div className={styles.chromeMeta}>
          <span className={styles.activityDot} aria-hidden="true" />
          <span>{l.sample}</span>
        </div>
      </div>

      <div className={styles.pathbar}>
        <span className={styles.scenario}><GitBranch size={14} aria-hidden="true" /> {l.resource}</span>
        <ol aria-label={l.title}>
          {l.stages.map((stage, index) => (
            <li key={stage}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {stage}
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.workspace}>
        <div className={styles.model}>
          <div className={styles.panelHeader}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            <span>{l.inputs}</span>
          </div>
          <p className={styles.controlLabel}>{l.budget}</p>
          <div className={styles.budgetSwitcher} role="group" aria-label={l.budget}>
            {([40, 70] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={budget === value ? styles.budgetSelected : undefined}
                aria-pressed={budget === value}
                onClick={() => setBudget(value)}
              >
                €{value}k
              </button>
            ))}
          </div>
          <dl className={styles.factList}>
            <div>
              <dt>{l.requests}</dt>
              <dd>12</dd>
            </div>
            <div>
              <dt>{l.priority}</dt>
              <dd>{l.urgent}</dd>
            </div>
          </dl>
          <div className={styles.codeBlock}>
            <div className={styles.panelHeader}>
              <LockKeyhole size={15} aria-hidden="true" />
              <span>{l.rules}</span>
            </div>
            <code>
              <span><b>maximize</b> {l.objective.replace('objective: ', '')}</span>
              <span><b>subject to</b></span>
              <span>  {l.budgetRule}</span>
              <span>  {l.eligibleRule}</span>
            </code>
            <small>{l.codeLabel}</small>
          </div>
        </div>

        <div className={styles.result}>
          <div className={styles.panelHeader}>
            <CircleDot size={16} aria-hidden="true" />
            <span>{l.evaluation}</span>
            <span className={styles.resultState}><Check size={13} aria-hidden="true" /> {l.stages[2]}</span>
          </div>
          <span className={styles.resultLabel}>{l.recommendation}</span>
          <strong className={styles.outcome} key={budget}>{budget === 40 ? l.outcomeLow : l.outcomeHigh}</strong>
          <div className={styles.progressHeader}>
            <span>{l.coverage}</span>
            <strong>{funded}<em>/12</em></strong>
          </div>
          <div className={styles.requestTiles} aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} className={index < funded ? styles.funded : undefined} />
            ))}
          </div>
          <div className={styles.rationale}>
            <div className={styles.panelHeader}>
              <Check size={15} aria-hidden="true" />
              <span>{l.rationale}</span>
            </div>
            <p key={budget}>{budget === 40 ? l.whyLow : l.whyHigh}</p>
            <div className={styles.approval}>
              <span className={styles.approvalIcon}>H</span>
              <span>{l.gate}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.consoleFooter}>
        <span>{l.none}</span>
        <a href={observatoryHref('resource-allocation', locale)}>
          {l.inspect} <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
