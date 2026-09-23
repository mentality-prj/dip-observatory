import Link from 'next/link'
import { GitCompareArrows, History, SearchCheck } from 'lucide-react'
import { marketingLocaleHref, observatoryHref } from '@/lib/platform-urls'
import { marketingA11yI18n } from '@/lib/product-i18n'
import type { MarketingLocale } from './qdip-copy'
import styles from './qdip-site.module.css'

const copy = {
  en: {
    items: [
      ['Audit trace', 'Open an inspectable recommendation with alternatives, evidence and decision trace.', 'Inspect a decision'],
      ['Baseline comparison', 'Compare a QDIP recommendation with the current resource-allocation plan through the same evaluation path.', 'Open Resource Allocation'],
      ['Deterministic replay', 'Review the research and reproducibility layer used to keep decision paths inspectable across runs.', 'Review research'],
    ],
    links: ['Architecture', 'Explainability', 'Research'],
  },
  uk: {
    items: [
      ['Аудит рішення', 'Відкрийте рекомендацію з альтернативами, доказами та історією рішення для перевірки.', 'Перевірити рішення'],
      ['Порівняння з базовим сценарієм', 'Порівняйте рекомендацію QDIP з поточним планом розподілу ресурсів через той самий шлях оцінювання.', 'Відкрити Resource Allocation'],
      ['Детерміноване відтворення', 'Перегляньте дослідження та шар відтворюваності, який зберігає шлях рішення відтворюваним між запусками.', 'Переглянути дослідження'],
    ],
    links: ['Архітектура', 'Пояснюваність', 'Дослідження'],
  },
  pl: {
    items: [
      ['Ślad audytowy decyzji', 'Otwórz rekomendację z alternatywami, dowodami i śladem decyzji do inspekcji.', 'Sprawdź decyzję'],
      ['Porównanie ze scenariuszem bazowym', 'Porównaj rekomendację QDIP z bieżącym planem alokacji zasobów w tej samej ścieżce oceny.', 'Otwórz Resource Allocation'],
      ['Deterministyczne odtworzenie', 'Przejrzyj warstwę badań i odtwarzalności, która zachowuje ścieżkę decyzji między przebiegami.', 'Przejrzyj badania'],
    ],
    links: ['Architektura', 'Wyjaśnialność', 'Badania'],
  },
} as const

const icons = [SearchCheck, GitCompareArrows, History] as const

export function EvidenceStrip({ locale }: { locale: MarketingLocale }) {
  const base = marketingLocaleHref(locale)
  const destinations = [
    observatoryHref('', locale),
    observatoryHref('resource-allocation', locale),
    `${base}/core/research`,
  ] as const
  const c = copy[locale]
  const a11y = marketingA11yI18n[locale]

  return (
    <section className={styles.evidenceStrip} id="why" aria-label={a11y.evidence}>
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
      <nav className={styles.evidenceLinks} aria-label={a11y.technicalEvidence}>
        <Link href={`${base}/core/architecture`}>{c.links[0]}</Link>
        <Link href={`${base}/core/explainability`}>{c.links[1]}</Link>
        <Link href={`${base}/core/research`}>{c.links[2]}</Link>
      </nav>
    </section>
  )
}
