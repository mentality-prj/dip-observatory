'use client'

import { useState } from 'react'
import { ArrowRight, Check, CircleSlash2 } from 'lucide-react'
import { marketingLocaleHref, observatoryHref } from '@/lib/platform-urls'
import { DECISION_PATTERNS, decisionPattern, type DecisionPatternId } from '@/product/experience'
import { MarketingTrackedLink } from './marketing-analytics'
import type { MarketingLocale } from './qdip-copy'
import styles from './decision-patterns.module.css'

type Props = { locale: MarketingLocale; cases: readonly string[] }
const labels = {
  en: {
    why: 'Why this recommendation?',
    reason: ['Fits the active constraints', 'Balances the configured priorities', 'Keeps the trade-offs visible'],
    gtmBody: 'Evaluate commercial opportunities against objectives, costs, evidence and uncertainty.',
  },
  uk: {
    why: 'Чому ця рекомендація?',
    reason: ['Відповідає чинним обмеженням', 'Ураховує задані пріоритети', 'Показує компроміси між варіантами'],
    gtmBody: 'Оцінюйте комерційні можливості за цілями, витратами, доказами та невизначеністю.',
  },
  pl: {
    why: 'Dlaczego ta rekomendacja?',
    reason: [
      'Spełnia aktywne ograniczenia',
      'Uwzględnia skonfigurowane priorytety',
      'Pokazuje kompromisy między opcjami',
    ],
    gtmBody: 'Oceniaj możliwości komercyjne względem celów, kosztów, dowodów i niepewności.',
  },
} as const
const patternOrder = Object.keys(DECISION_PATTERNS) as DecisionPatternId[]

export function DecisionPatterns({ locale, cases: c }: Props) {
  const [active, setActive] = useState<DecisionPatternId>('allocate')
  const l = labels[locale]
  const marketing = {
    allocate: {
      tab: c[1],
      title: c[2],
      question: c[3],
      body: c[4],
      href: observatoryHref('resource-allocation', locale),
      cta: c[5],
    },
    decide: {
      tab: c[6],
      title: c[7],
      question: c[8],
      body: c[9],
      href: `${marketingLocaleHref(locale)}/decision`,
      cta: c[10],
    },
    prioritize: {
      tab: c[11],
      title: c[12],
      question: c[13],
      body: l.gtmBody,
      href: observatoryHref('gtm-lab', locale),
      cta: c[14],
    },
  } satisfies Record<
    DecisionPatternId,
    { tab: string; title: string; question: string; body: string; href: string; cta: string }
  >
  const current = marketing[active]
  const pattern = decisionPattern(active)
  const inputs = pattern.inputs[locale]
  const output = pattern.output[locale]

  return (
    <div className={styles.showcase}>
      <div className={styles.tabs} role="tablist" aria-label={c[0]}>
        {patternOrder.map((key) => (
          <button key={key} type="button" role="tab" aria-selected={active === key} onClick={() => setActive(key)}>
            {marketing[key].tab}
          </button>
        ))}
      </div>
      <div className={styles.stage} role="tabpanel">
        <div className={styles.context}>
          <span className={styles.kicker}>{current.title}</span>
          <h3>{current.question}</h3>
          <p>{current.body}</p>
          <MarketingTrackedLink
            event="marketing_demo_click"
            locale={locale}
            placement={`demo_${active}`}
            href={current.href}
          >
            {current.cta} <ArrowRight size={15} />
          </MarketingTrackedLink>
        </div>
        <div className={styles.engineFlow} aria-label={`${inputs.join(', ')} → QDIP → ${output}`}>
          <div className={styles.inputs}>
            {inputs.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <ArrowRight className={styles.arrow} aria-hidden="true" />
          <div className={styles.output}>
            <strong>{output}</strong>
            <span>
              <Check size={14} />
              {l.reason[0]}
            </span>
            <span>
              <Check size={14} />
              {l.reason[1]}
            </span>
            <span>
              <CircleSlash2 size={14} />
              {l.reason[2]}
            </span>
            <small>{l.why}</small>
          </div>
        </div>
      </div>
    </div>
  )
}
