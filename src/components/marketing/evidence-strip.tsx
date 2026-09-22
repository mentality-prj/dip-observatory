import Link from 'next/link'
import { FlaskConical, GitCompareArrows, Repeat2, Scale, ScanSearch, ShieldCheck } from 'lucide-react'
import { marketingLocaleHref } from '@/lib/platform-urls'
import type { MarketingLocale } from './qdip-copy'
import styles from './qdip-site.module.css'

const copy = {
  en: [
    ['Reproducible', 'Experiments and decision runs keep their inputs and versions visible.'],
    ['Inspectable', 'Audit trace and evidence remain attached to the recommendation.'],
    ['Explainable', 'Review constraints, trade-offs and the factors behind a result.'],
    [
      'Baseline-aware',
      'Experiments compare against explicit baselines instead of presenting model output in isolation.',
    ],
    [
      'Deterministic demos',
      'Bundled demo states can be replayed so the same inputs produce the same inspectable path.',
    ],
    ['Research-backed', 'Architecture and research notes are available for technical review.'],
  ],
  uk: [
    ['Відтворюваність', 'Експерименти та decision runs зберігають видимими вхідні дані й версії.'],
    ['Перевірюваність', 'Audit trace і докази залишаються пов’язаними з рекомендацією.'],
    ['Пояснюваність', 'Перевіряйте обмеження, компроміси та фактори, що вплинули на результат.'],
    [
      'Порівняння з baseline',
      'Експерименти порівнюються з явними baseline, а не показують модельний результат ізольовано.',
    ],
    ['Детерміновані демо', 'Вбудовані demo states можна повторити з тим самим відтворюваним шляхом рішення.'],
    ['Наукова основа', 'Архітектура та research notes доступні для технічного аналізу.'],
  ],
  pl: [
    ['Powtarzalność', 'Eksperymenty i przebiegi decyzji zachowują widoczne dane wejściowe oraz wersje.'],
    ['Inspekcja', 'Audit trace i dowody pozostają powiązane z rekomendacją.'],
    ['Wyjaśnialność', 'Sprawdzaj ograniczenia, kompromisy i czynniki stojące za wynikiem.'],
    ['Porównanie z baseline', 'Eksperymenty są porównywane z jawnymi baseline, a nie pokazywane w izolacji.'],
    ['Deterministyczne demo', 'Wbudowane stany demo można odtworzyć z tym samym inspekcyjnym przebiegiem decyzji.'],
    ['Podstawa badawcza', 'Architektura i notatki badawcze są dostępne do przeglądu technicznego.'],
  ],
} as const

const icons = [FlaskConical, ShieldCheck, ScanSearch, Scale, Repeat2, GitCompareArrows] as const

export function EvidenceStrip({ locale }: { locale: MarketingLocale }) {
  const base = marketingLocaleHref(locale)
  return (
    <section className={styles.evidenceStrip} id="why" aria-label="QDIP evidence and trust">
      <div className={styles.evidenceGrid}>
        {copy[locale].map(([title, body], index) => {
          const Icon = icons[index] ?? ShieldCheck
          return (
            <article key={title}>
              <Icon size={17} aria-hidden />
              <div>
                <strong>{title}</strong>
                <span>{body}</span>
              </div>
            </article>
          )
        })}
      </div>
      <nav className={styles.evidenceLinks} aria-label="Technical evidence">
        <Link href={`${base}/core/architecture`}>Architecture</Link>
        <Link href={`${base}/core/explainability`}>Explainability</Link>
        <Link href={`${base}/core/research`}>Research</Link>
      </nav>
    </section>
  )
}
