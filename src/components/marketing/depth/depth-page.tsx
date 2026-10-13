import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DesignSystemProvider } from '@/design-system'
import { marketingLocaleHref, observatoryHref } from '@/lib/platform-urls'
import { MarketingHeader } from '../marketing-header'
import { MarketingFooter } from '../marketing-footer'
import type { MarketingLocale } from '../qdip-copy'
import { getDepthContent, type DepthPageKey } from './content'
import { depthUiI18n } from './i18n'
import styles from './depth-page.module.css'
import motionStyles from '../marketing-cta-motion.module.css'
import atmosphereStyles from '../marketing-atmosphere.module.css'
import burgundyStyles from '../marketing-deep-burgundy.module.css'
import { MarketingTechIcon, type TechIconName } from '../marketing-tech-icon'

const localeHref = (l: MarketingLocale, path: string) => `${marketingLocaleHref(l)}/${path}`

export function DepthPage({ locale, page }: { locale: MarketingLocale; page: DepthPageKey }) {
  const c = getDepthContent(locale, page)
  const labels = depthUiI18n[locale]
  return (
    <DesignSystemProvider theme="burgundy" mode="dark" className={`${styles.page} ${atmosphereStyles.atmosphere} ${burgundyStyles.theme}`}>
      <main id="main-content" lang={locale}>
        <MarketingHeader locale={locale} currentPath={page} />
        <section className={styles.hero}>
          <div className={styles.eyebrow}>{c.hero[0]}</div>
          <h1>{c.hero[1]}</h1>
          <p>{c.hero[2]}</p>
          <div className={styles.heroActions}>
            <Link className={`${styles.primary} ${motionStyles.primary}`} href={localeHref(locale, 'use-cases#demos')}>
              {labels.explore} <ArrowRight size={15} />
            </Link>
            <Link className={`${styles.secondary} ${motionStyles.secondary}`} href={localeHref(locale, 'decision')}>
              {labels.describe}
            </Link>
          </div>
        </section>
        {c.cases && (
          <section id="demos" className={styles.cases}>
            {c.cases.map((x) => (
              <article key={x.title} className={styles.case}>
                <MarketingTechIcon name="allocation" className={styles.techFeatureIcon} />
                <div className={styles.pattern}>{x.pattern}</div>
                <h2>{x.title}</h2>
                <h3>{x.question}</h3>
                <p>{x.problem}</p>
                <dl>
                  <div>
                    <dt>{labels.inputs}</dt>
                    <dd>{x.inputs}</dd>
                  </div>
                  <div>
                    <dt>{labels.evaluation}</dt>
                    <dd>{x.evaluation}</dd>
                  </div>
                  <div>
                    <dt>{labels.output}</dt>
                    <dd>{x.output}</dd>
                  </div>
                </dl>
                <Link href={observatoryHref(x.href, locale)}>
                  {labels.open} {x.title} <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </section>
        )}
        <div className={styles.sections}>
          {c.sections.map((s, index) => (
            <section key={s.title} className={styles.section}>
              <div className={styles.sectionIndex}>0{index + 1}</div>
              <div className={styles.sectionCopy}>
                {s.eyebrow && <div className={styles.eyebrow}>{s.eyebrow}</div>}
                <h2>{s.title}</h2>
                <p>{s.body}</p>
                {s.items && (
                  <div className={styles.items}>
                    {s.items.map((i, iconIndex) => (
                      <article key={i.title}>
                        <MarketingTechIcon
                          name={(
                            [
                              'modeling',
                              'constraints',
                              'optimization',
                              'explainability',
                              'human-approval',
                              'simulation',
                              'allocation',
                              'workflow',
                              'evidence',
                              'policy',
                            ] as TechIconName[]
                          )[(index + iconIndex) % 10]}
                          className={styles.techFeatureIcon}
                        />
                        <div>
                          <h3>{i.title}</h3>
                          <p>{i.body}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
        <section className={styles.cta}>
          <div>
            <div className={styles.eyebrow}>{labels.next}</div>
            <h2>{c.cta[0]}</h2>
            <p>{c.cta[1]}</p>
          </div>
          <Link
            className={`${styles.primary} ${motionStyles.primary}`}
            href={page === 'core' ? localeHref(locale, 'core/research') : localeHref(locale, 'decision')}
          >
            {c.cta[2]} <ArrowRight size={15} />
          </Link>
        </section>
        <MarketingFooter locale={locale} />
      </main>
    </DesignSystemProvider>
  )
}
