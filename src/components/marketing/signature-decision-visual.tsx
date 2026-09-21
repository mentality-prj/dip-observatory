import type { CSSProperties } from 'react'
import { ArrowDown, ArrowRight, Check, X } from 'lucide-react'
import type { MarketingLocale } from './qdip-copy'
import styles from './signature-decision-visual.module.css'

type IndexedStyle = CSSProperties & { '--i': number }
const alternatives = {
  en: {
    label: 'Alternatives',
    items: ['Option A', 'Option B', 'Option C'],
    rejected: 'constraint',
    recommended: 'recommended',
    why: 'why?',
  },
  uk: {
    label: 'Альтернативи',
    items: ['Варіант A', 'Варіант B', 'Варіант C'],
    rejected: 'обмеження',
    recommended: 'рекомендовано',
    why: 'чому?',
  },
  pl: {
    label: 'Alternatywy',
    items: ['Opcja A', 'Opcja B', 'Opcja C'],
    rejected: 'ograniczenie',
    recommended: 'rekomendowana',
    why: 'dlaczego?',
  },
} as const

export function SignatureDecisionVisual({ labels, locale }: { labels: readonly string[]; locale: MarketingLocale }) {
  const a = alternatives[locale]
  return (
    <figure className={styles.visual} aria-label={labels.join(' → ')}>
      <div className={styles.inputs}>
        {labels.slice(0, 4).map((label, index) => (
          <span style={{ '--i': index } as IndexedStyle} key={label}>
            {label}
          </span>
        ))}
      </div>
      <ArrowRight className={styles.arrow} aria-hidden="true" size={20} />
      <div className={styles.engine}>
        QDIP<small>{labels[4]}</small>
      </div>
      <ArrowRight className={styles.arrow} aria-hidden="true" size={20} />
      <div className={styles.evaluation}>
        <small>{a.label}</small>
        {a.items.map((item, index) => (
          <span className={index === 1 ? styles.selected : index === 2 ? styles.rejected : undefined} key={item}>
            {index === 1 && <Check size={12} />} {index === 2 && <X size={12} />} {item}
            {index === 1 && <em>{a.recommended}</em>}
            {index === 2 && <em>{a.rejected}</em>}
          </span>
        ))}
      </div>
      <ArrowRight className={styles.arrow} aria-hidden="true" size={20} />
      <div className={styles.result}>
        <strong>{labels[5]}</strong>
        <span>{labels[6]}</span>
        <em>{a.why}</em>
      </div>
      <ArrowRight className={styles.arrow} aria-hidden="true" size={20} />
      <div className={styles.human}>
        {labels[7]}
        <ArrowDown aria-hidden="true" size={14} />
      </div>
    </figure>
  )
}
