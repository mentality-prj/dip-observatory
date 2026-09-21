import Link from 'next/link'
import { ArrowRight, Check, Play } from 'lucide-react'
import { DesignSystemProvider } from '@/design-system'
import { marketingLocaleHref } from '@/lib/platform-urls'
import { marketingCopy, type MarketingLocale } from './qdip-copy'
import { QdipLogo } from './qdip-logo'
import { MarketingHeader } from './marketing-header'
import { SignatureDecisionVisual } from './signature-decision-visual'
import { DecisionPatterns } from './decision-patterns'
import { DecisionPlayground } from './decision-playground'
import { ProductJourney } from './product-journey'
import { PilotPath } from './pilot-path'
import { EvidenceStrip } from './evidence-strip'
import { conversionBridgeCopy } from './conversion-copy'
import styles from './qdip-site.module.css'

const path = (locale: MarketingLocale, slug: string) => `${marketingLocaleHref(locale)}/${slug}`

export function QdipSite({ locale = 'en' }: { locale?: MarketingLocale }) {
  const c = marketingCopy[locale]
  const valueIndexes = [1, 3, 11, 5, 7, 9]
  const decisionHref = path(locale, 'decision')
  return (
    <DesignSystemProvider theme="burgundy" mode="light" className={styles.site}>
      <main id="main-content" lang={locale}>
        <MarketingHeader locale={locale} />
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>{c.hero[0]}</div>
            <h1>{c.hero[1]}</h1>
            <p className={styles.lead}>{c.hero[2]}</p>
            <p>{c.hero[3]}</p>
            <strong className={styles.human}>{c.hero[4]}</strong>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButtonLarge} href={path(locale, 'use-cases')}>
                <Play size={16} />
                {c.hero[5]}
              </Link>
              <Link className={styles.secondaryButton} href={path(locale, 'how-it-works')}>
                {c.nav[0]} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <SignatureDecisionVisual locale={locale} labels={c.diagram} />
        </section>
        <EvidenceStrip locale={locale} />
        <section className={`${styles.section} ${styles.editorialSection}`}>
          <div className={styles.sectionIntro}>
            <h2>{c.problem[0]}</h2>
          </div>
          <div className={styles.questionGrid}>
            {c.problem.slice(1, 5).map((x) => (
              <article key={x}>{x}</article>
            ))}
          </div>
          <p className={styles.centerCopy}>
            {c.problem[5]} <strong>{c.problem[6]}</strong>
          </p>
          <p className={styles.businessBridge}>{c.bridge}</p>
        </section>
        <DecisionPlayground locale={locale} />
        <section className={`${styles.section} ${styles.patternSection}`} id="demos">
          <div className={styles.sectionIntro}>
            <div className={styles.eyebrow}>ALLOCATE · DECIDE · PRIORITIZE</div>
            <h2>{c.cases[0]}</h2>
          </div>
          <DecisionPatterns locale={locale} cases={c.cases} />
          <div className={styles.demoBridge}>
            <span>{conversionBridgeCopy[locale].question}</span>
            <Link href={decisionHref}>
              {c.conversion[2]} <ArrowRight size={14} />
            </Link>
          </div>
        </section>
        <ProductJourney locale={locale} demoHref="#demos" coreHref={path(locale, 'core')} />
        <section className={styles.softSection} id="why">
          <div className={styles.sectionIntro}>
            <h2>{c.why[0]}</h2>
          </div>
          <div className={styles.valueGrid}>
            {valueIndexes.map((i, index) => (
              <article className={index < 3 ? styles.featuredCase : undefined} key={c.why[i]}>
                <Check size={18} />
                <h3>{c.why[i]}</h3>
                <p>{c.why[i + 1]}</p>
              </article>
            ))}
          </div>
        </section>
        <PilotPath locale={locale} decisionHref={decisionHref} />
        <section className={styles.finalCta}>
          <h2>{c.conversion[0]}</h2>
          <p>{c.conversion[1]}</p>
          <Link className={styles.primaryButtonLarge} href={decisionHref}>
            {c.conversion[2]} <ArrowRight size={16} />
          </Link>
        </section>
        <footer className={styles.footer}>
          <QdipLogo />
          <nav>
            <Link href={path(locale, 'how-it-works')}>{c.nav[0]}</Link>
            <Link href={path(locale, 'use-cases')}>{c.nav[1]}</Link>
            <Link href={path(locale, 'core')}>QDIP Core</Link>
            <Link href={path(locale, 'core/research')}>Research</Link>
          </nav>
          <span>© {new Date().getFullYear()} QDIP</span>
        </footer>
      </main>
    </DesignSystemProvider>
  )
}
