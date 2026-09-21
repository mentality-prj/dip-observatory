import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import type { MarketingLocale } from './qdip-copy'
import styles from './pilot-path.module.css'

const copy = {
  en: {
    eyebrow: 'Start small',
    title: 'Test QDIP on one decision before committing to more.',
    body: "A pilot starts with a decision your team already makes repeatedly. We model the inputs, alternatives, priorities and constraints, then compare QDIP's recommendations with the way you work today.",
    steps: [
      [
        '01',
        'Choose one decision',
        'Pick a recurring decision where comparison takes time or depends too much on who handles it.',
      ],
      [
        '02',
        'Model what matters',
        'Define the information, alternatives, priorities and constraints already used by your team.',
      ],
      [
        '03',
        'Test real scenarios',
        'Run representative cases and inspect the recommendation, evidence and trade-offs.',
      ],
      [
        '04',
        'Decide if it helps',
        'Compare the result with your current process. Expand only if the pilot creates practical value.',
      ],
    ],
    note: 'No platform-wide rollout is required to test the idea.',
    cta: 'Describe your decision',
  },
  uk: {
    eyebrow: 'Почніть з малого',
    title: 'Перевірте QDIP на одному рішенні, перш ніж рухатися далі.',
    body: 'Пілот починається з рішення, яке ваша команда вже приймає регулярно. Ми моделюємо вхідні дані, альтернативи, пріоритети та обмеження, а потім порівнюємо рекомендації QDIP з вашим поточним підходом.',
    steps: [
      [
        '01',
        'Оберіть одне рішення',
        'Візьміть регулярне рішення, де порівняння забирає час або результат надто залежить від того, хто його приймає.',
      ],
      [
        '02',
        'Опишіть важливе',
        'Визначте інформацію, альтернативи, пріоритети та обмеження, які команда вже використовує.',
      ],
      [
        '03',
        'Перевірте реальні сценарії',
        'Запустіть типові випадки та перегляньте рекомендацію, обґрунтування й компроміси.',
      ],
      [
        '04',
        'Оцініть користь',
        'Порівняйте результат з поточним процесом. Розширюйте використання лише якщо пілот дає практичну цінність.',
      ],
    ],
    note: 'Для перевірки ідеї не потрібне впровадження платформи в усій організації.',
    cta: 'Описати ваше рішення',
  },
  pl: {
    eyebrow: 'Zacznij od małego zakresu',
    title: 'Sprawdź QDIP na jednej decyzji, zanim pójdziesz dalej.',
    body: 'Pilotaż zaczyna się od decyzji, którą Twój zespół już regularnie podejmuje. Modelujemy dane wejściowe, alternatywy, priorytety i ograniczenia, a następnie porównujemy rekomendacje QDIP z obecnym sposobem pracy.',
    steps: [
      [
        '01',
        'Wybierz jedną decyzję',
        'Wybierz powtarzalną decyzję, której porównanie zajmuje czas lub zbyt mocno zależy od osoby, która ją podejmuje.',
      ],
      [
        '02',
        'Zdefiniuj, co ma znaczenie',
        'Określ informacje, alternatywy, priorytety i ograniczenia już używane przez zespół.',
      ],
      [
        '03',
        'Przetestuj rzeczywiste scenariusze',
        'Uruchom reprezentatywne przypadki i przeanalizuj rekomendację, uzasadnienie oraz kompromisy.',
      ],
      [
        '04',
        'Oceń przydatność',
        'Porównaj wynik z obecnym procesem. Rozszerz użycie tylko wtedy, gdy pilotaż daje praktyczną wartość.',
      ],
    ],
    note: 'Do sprawdzenia pomysłu nie jest potrzebne wdrożenie platformy w całej organizacji.',
    cta: 'Opisz swoją decyzję',
  },
} as const

export function PilotPath({ locale, decisionHref }: { locale: MarketingLocale; decisionHref: string }) {
  const c = copy[locale]
  return (
    <section className={styles.pilot}>
      <div className={styles.intro}>
        <span>{c.eyebrow}</span>
        <h2>{c.title}</h2>
        <p>{c.body}</p>
        <div className={styles.note}>
          <Check size={16} />
          {c.note}
        </div>
        <Link href={decisionHref}>
          {c.cta}
          <ArrowRight size={15} />
        </Link>
      </div>
      <div className={styles.steps}>
        {c.steps.map(([n, t, b]) => (
          <article key={n}>
            <b>{n}</b>
            <div>
              <h3>{t}</h3>
              <p>{b}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
