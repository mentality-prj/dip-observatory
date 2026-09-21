import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { MarketingLocale } from './qdip-copy'
import styles from './use-case-conversion-note.module.css'

const copy = {
  en: [
    'Your decision does not need to look exactly like these demos.',
    'QDIP is designed around the structure of a decision: alternatives, priorities, constraints, evidence and uncertainty. Start by showing us the decision you repeat today.',
    'See if your decision fits',
  ],
  uk: [
    'Ваше рішення не повинно точно повторювати ці демо.',
    'QDIP працює зі структурою рішення: альтернативами, пріоритетами, обмеженнями, обґрунтуванням і невизначеністю. Почніть з рішення, яке ви регулярно приймаєте сьогодні.',
    'Перевірити, чи підходить ваше рішення',
  ],
  pl: [
    'Twoja decyzja nie musi wyglądać dokładnie jak te demo.',
    'QDIP opiera się na strukturze decyzji: alternatywach, priorytetach, ograniczeniach, uzasadnieniu i niepewności. Zacznij od decyzji, którą regularnie podejmujesz już dziś.',
    'Sprawdź, czy Twoja decyzja pasuje',
  ],
} as const
export function UseCaseConversionNote({ locale, href }: { locale: MarketingLocale; href: string }) {
  const c = copy[locale]
  return (
    <aside className={styles.note}>
      <div>
        <strong>{c[0]}</strong>
        <p>{c[1]}</p>
      </div>
      <Link href={href}>
        {c[2]}
        <ArrowRight size={15} />
      </Link>
    </aside>
  )
}
