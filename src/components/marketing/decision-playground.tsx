'use client'

import { useState } from 'react'
import { Check, SlidersHorizontal } from 'lucide-react'
import { DecisionWorkflow } from '@/components/product/decision-workflow'
import type { MarketingLocale } from './qdip-copy'
import styles from './decision-playground.module.css'

const copy = {
  en: {
    eyebrow: 'CHANGE ONE THING',
    title: 'See a decision react to a changing constraint.',
    body: 'A small resource-allocation example. Change the available budget and inspect how the recommendation changes — without hiding the trade-off.',
    budget: 'Available budget',
    requests: '12 eligible requests',
    priority: 'Priority: urgent need',
    low: '€40k',
    high: '€70k',
    recommendation: 'Recommendation',
    lowResult: 'Fund the highest-priority 5 requests',
    highResult: 'Fund the highest-priority 8 requests',
    why: 'Why?',
    lowWhy:
      'The tighter budget makes 7 otherwise eligible requests infeasible. QDIP preserves the configured priority order within the active constraint.',
    highWhy:
      'The larger budget makes 3 additional requests feasible while preserving the same priorities and eligibility rules.',
    human: 'Recommendation, not an automatic decision',
    cta: 'Change the budget',
  },
  uk: {
    eyebrow: 'ЗМІНІТЬ ОДНУ УМОВУ',
    title: 'Подивіться, як рішення реагує на зміну обмеження.',
    body: 'Невеликий приклад розподілу ресурсів. Змініть доступний бюджет і подивіться, як змінюється рекомендація — разом із видимим компромісом.',
    budget: 'Доступний бюджет',
    requests: '12 допустимих запитів',
    priority: 'Пріоритет: нагальна потреба',
    low: '€40 тис.',
    high: '€70 тис.',
    recommendation: 'Рекомендація',
    lowResult: 'Профінансувати 5 найпріоритетніших запитів',
    highResult: 'Профінансувати 8 найпріоритетніших запитів',
    why: 'Чому?',
    lowWhy:
      'Жорсткіший бюджет робить 7 допустимих запитів нездійсненними. QDIP зберігає заданий порядок пріоритетів у межах чинного обмеження.',
    highWhy: 'Більший бюджет робить можливими ще 3 запити, зберігаючи ті самі пріоритети та правила допустимості.',
    human: 'Рекомендація, а не автоматичне рішення',
    cta: 'Змінити бюджет',
  },
  pl: {
    eyebrow: 'ZMIEŃ JEDEN WARUNEK',
    title: 'Zobacz, jak decyzja reaguje na zmianę ograniczenia.',
    body: 'Mały przykład alokacji zasobów. Zmień dostępny budżet i zobacz, jak zmienia się rekomendacja — bez ukrywania kompromisu.',
    budget: 'Dostępny budżet',
    requests: '12 kwalifikujących się wniosków',
    priority: 'Priorytet: pilna potrzeba',
    low: '€40 tys.',
    high: '€70 tys.',
    recommendation: 'Rekomendacja',
    lowResult: 'Sfinansuj 5 wniosków o najwyższym priorytecie',
    highResult: 'Sfinansuj 8 wniosków o najwyższym priorytecie',
    why: 'Dlaczego?',
    lowWhy:
      'Niższy budżet sprawia, że 7 kwalifikujących się wniosków jest niewykonalnych. QDIP zachowuje skonfigurowaną kolejność priorytetów w ramach aktywnego ograniczenia.',
    highWhy:
      'Wyższy budżet pozwala uwzględnić 3 dodatkowe wnioski przy zachowaniu tych samych priorytetów i reguł kwalifikacji.',
    human: 'Rekomendacja, nie automatyczna decyzja',
    cta: 'Zmień budżet',
  },
} as const

export function DecisionPlayground({ locale }: { locale: MarketingLocale }) {
  const c = copy[locale]
  const [expanded, setExpanded] = useState(false)
  const result = expanded ? c.highResult : c.lowResult
  const reason = expanded ? c.highWhy : c.lowWhy
  return (
    <section className={styles.section} aria-labelledby="decision-playground-title">
      <div className={styles.copy}>
        <span>{c.eyebrow}</span>
        <h2 id="decision-playground-title">{c.title}</h2>
        <p>{c.body}</p>
        <div className={styles.signal}>
          <SlidersHorizontal size={16} />
          <span>{c.human}</span>
        </div>
      </div>
      <div className={styles.stage}>
        <DecisionWorkflow locale={locale} compact />
        <div className={styles.controls}>
          <div>
            <small>{c.budget}</small>
            <strong>{expanded ? c.high : c.low}</strong>
          </div>
          <button type="button" aria-pressed={expanded} onClick={() => setExpanded((v) => !v)}>
            <span>{c.low}</span>
            <i className={expanded ? styles.on : ''} />
            <span>{c.high}</span>
            <b>{c.cta}</b>
          </button>
        </div>
        <div className={styles.context}>
          <span>{c.requests}</span>
          <span>{c.priority}</span>
        </div>
        <div className={styles.result}>
          <small>{c.recommendation}</small>
          <strong key={result}>
            <Check size={17} />
            {result}
          </strong>
        </div>
        <div className={styles.reason}>
          <strong>{c.why}</strong>
          <p key={reason}>{reason}</p>
        </div>
      </div>
    </section>
  )
}
