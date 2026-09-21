import Link from 'next/link'
import { ArrowRight, Cpu, Eye, Play, SlidersHorizontal } from 'lucide-react'

import { observatoryHref, studioHref } from '@/lib/platform-urls'
import type { Locale } from '@/lib/observatory-i18n'
import { PRODUCT_SURFACE_COPY, type ProductSurfaceId } from '@/product/experience'
import styles from './product-journey.module.css'

const icons = { demo: Play, studio: SlidersHorizontal, core: Cpu, observatory: Eye } as const

const heading = {
  en: [
    'ONE DECISION SYSTEM',
    'Try it. Configure it. Evaluate it. Understand it.',
    'QDIP is not four separate products. Each surface exposes a different part of the same decision lifecycle.',
  ],
  uk: [
    'ОДНА СИСТЕМА РІШЕНЬ',
    'Спробуйте. Налаштуйте. Оцініть. Зрозумійте.',
    'QDIP — не чотири окремі продукти. Кожна поверхня показує іншу частину одного життєвого циклу рішення.',
  ],
  pl: [
    'JEDEN SYSTEM DECYZYJNY',
    'Wypróbuj. Skonfiguruj. Oceń. Zrozum.',
    'QDIP nie jest czterema osobnymi produktami. Każda warstwa pokazuje inną część tego samego cyklu decyzji.',
  ],
} as const

export function ProductJourney({ locale, demoHref, coreHref }: { locale: Locale; demoHref: string; coreHref: string }) {
  const links: Record<ProductSurfaceId, string> = {
    demo: demoHref,
    studio: studioHref(),
    core: coreHref,
    observatory: observatoryHref(locale),
  }
  const [eyebrow, title, body] = heading[locale]

  return (
    <section className={styles.section} aria-labelledby="product-journey-title">
      <div className={styles.intro}>
        <span>{eyebrow}</span>
        <h2 id="product-journey-title">{title}</h2>
        <p>{body}</p>
      </div>
      <div className={styles.rail}>
        {PRODUCT_SURFACE_COPY[locale].map((surface, index) => {
          const Icon = icons[surface.id]
          return (
            <article key={surface.id} data-surface={surface.id}>
              <div className={styles.top}>
                <span>0{index + 1}</span>
                <Icon size={18} aria-hidden="true" />
              </div>
              <small>{surface.verb}</small>
              <h3>{surface.title}</h3>
              <p>{surface.body}</p>
              <Link href={links[surface.id]}>
                {surface.cta}
                <ArrowRight size={14} />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
