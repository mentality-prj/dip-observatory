import Link from 'next/link'
import { GitCompareArrows, History, SearchCheck } from 'lucide-react'
import { marketingLocaleHref, observatoryHref } from '@/lib/platform-urls'
import type { MarketingLocale } from './qdip-copy'
import styles from './qdip-site.module.css'

const copy = {
  en: {
    items: [
      ['Audit trace', 'Open an inspectable recommendation with alternatives, evidence and decision trace.', 'Inspect a decision'],
      ['Baseline comparison', 'Review Gas Decision experiments against an explicit baseline instead of model output in isolation.', 'Open Gas Decision'],
      ['Deterministic replay', 'Review the research and reproducibility layer used to keep decision paths inspectable across runs.', 'Review research'],
    ],
    links: ['Architecture', 'Explainability', 'Research'],
  },
  uk: {
    items: [
      ['Audit trace', 'Відкрийте рекомендацію з альтернативами, доказами та trace рішення для перевірки.', 'Перевірити рішення'],
      ['Порівняння з baseline', 'Перегляньте експерименти Gas Decision у порівнянні з явним baseline, а не ізольованим результатом моделі.', 'Відкрити Gas Decision'],
      ['Детермінований replay', 'Перегляньте research і reproducibility layer, який зберігає шлях рішення відтворюваним між запусками.', 'Переглянути research'],
    ],
    links: ['Архітектура', 'Пояснюваність', 'Research'],
  },
  pl: {
    items: [
      ['Audit trace', 'Otwórz rekomendację z alternatywami, dowodami i trace decyzji do inspekcji.', 'Sprawdź decyzję'],
      ['Porównanie z baseline', 'Przejrzyj eksperymenty Gas Decision względem jawnego baseline zamiast izolowanego wyniku modelu.', 'Otwórz Gas Decision'],
      ['Deterministyczny replay', 'Przejrzyj warstwę badań i odtwarzalności, która zachowuje ścieżkę decyzji między przebiegami.', 'Przejrzyj research'],
    ],
    links: ['Architektura', 'Wyjaśnialność', 'Research'],
  },
} as const

const icons = [SearchCheck, GitCompareArrows, History] as const

export function EvidenceStrip({ locale }: { locale: MarketingLocale }) {
  const base = marketingLocaleHref(locale)
  const destinations = [
    observatoryHref('', locale),
    observatoryHref('gas-forecast', locale),
    `${base}/core/research`,
  ] as const
  const c = copy[locale]

  return (
    <section className={styles.evidenceStrip} id="why" aria-label="QDIP evidence and trust">
      <div className={styles.evidenceGrid}>
        {c.items.map(([title, body, action], index) => {
          const Icon = icons[index] ?? SearchCheck
          return (
            <article key={title}>
              <Icon size={17} aria-hidden />
              <div>
                <strong>{title}</strong>
                <span>{body}</span>
                <Link className={styles.evidenceArtifactLink} href={destinations[index]}>
                  {action}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
      <nav className={styles.evidenceLinks} aria-label="Technical evidence">
        <Link href={`${base}/core/architecture`}>{c.links[0]}</Link>
        <Link href={`${base}/core/explainability`}>{c.links[1]}</Link>
        <Link href={`${base}/core/research`}>{c.links[2]}</Link>
      </nav>
    </section>
  )
}
