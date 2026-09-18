import Link from "next/link";
import { Fragment } from "react";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Braces,
  Check,
  ChevronRight,
  CircleGauge,
  Eye,
  Factory,
  FileSearch,
  GitBranch,
  Globe2,
  KeyRound,
  Network,
  Play,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  marketingLocaleHref,
  observatoryHref,
  studioHref,
} from "@/lib/platform-urls";

import {
  marketingCopy,
  marketingLocales,
  type MarketingLocale,
} from "./qdip-copy";
import { QdipLogo } from "./qdip-logo";
import styles from "./qdip-site.module.css";

const localeLabels: Record<MarketingLocale, string> = {
  en: "EN",
  uk: "UA",
  pl: "PL",
};

const demoMeta = [
  { path: "gas-forecast", icon: BarChart3, accent: "burgundy" },
  { path: "production-replanning", icon: Factory, accent: "amber" },
  { path: "resource-allocation", icon: Network, accent: "copper" },
  { path: "supplier-decision", icon: Scale, accent: "violet" },
  { path: "production-scheduling", icon: Workflow, accent: "rose" },
  { path: "scenarios", icon: GitBranch, accent: "wine" },
] as const;

const capabilityIcons = [
  Blocks,
  FileSearch,
  SlidersHorizontal,
  KeyRound,
] as const;

function ModelField() {
  return (
    <div aria-hidden="true" className={styles.modelField}>
      <svg viewBox="0 0 980 700">
        <g className={styles.modelEdges}>
          <path d="M535 105 645 188 728 116" />
          <path d="M535 105 598 291 733 347" />
          <path d="M645 188 598 291 805 252" />
          <path d="M728 116 805 252 887 174" />
          <path d="M598 291 733 347 668 467" />
          <path d="M733 347 864 429 774 553" />
          <path d="M668 467 774 553 585 594" />
        </g>
        <path className={styles.decisionBoundary} d="M470 620C565 510 506 398 635 323S774 213 902 54" />
        <g className={styles.modelNodes}>
          {[[535,105],[645,188],[728,116],[598,291],[733,347],[805,252],[887,174],[668,467],[864,429],[774,553],[585,594]].map(([cx, cy], index) => (
            <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r={index === 4 ? 9 : 5} data-focus={index === 4 || undefined} />
          ))}
        </g>
        <g className={styles.latentPoints}>
          {[[508,504],[544,458],[564,534],[618,416],[704,254],[758,198],[816,142],[842,302],[713,501],[824,517],[625,151],[760,410]].map(([cx, cy]) => (
            <circle cx={cx} cy={cy} key={`${cx}-${cy}`} r="3" />
          ))}
        </g>
      </svg>
    </div>
  );
}

export function QdipSite({ locale = "en" }: { locale?: MarketingLocale }) {
  const copy = marketingCopy[locale];
  const observatoryLocale = locale === "uk" ? "en" : locale;

  return (
    <main className={styles.site} id="main-content" lang={locale} tabIndex={-1}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a aria-label="QDIP home" href={marketingLocaleHref(locale)}>
            <QdipLogo />
          </a>
          <nav aria-label="Primary navigation" className={styles.nav}>
            <a href="#platform">{copy.nav[0]}</a>
            <a href="#products">{copy.nav[1]}</a>
            <a href="#demos">{copy.nav[2]}</a>
            <a href="#trust">{copy.nav[3]}</a>
          </nav>
          <div className={styles.headerActions}>
            {/* Hard navigations are intentional: the host-aware proxy canonicalizes
                /platform/[locale] on qdip.ai while previews keep the explicit route. */}
            <nav aria-label="Language" className={styles.languageNav}>
              {marketingLocales.map((item) => (
                <a
                  aria-current={locale === item ? "page" : undefined}
                  href={marketingLocaleHref(item)}
                  key={item}
                >
                  {localeLabels[item]}
                </a>
              ))}
            </nav>
            <Link className={styles.textLink} href={studioHref()}>
              {copy.openStudio}
            </Link>
            <Link className={styles.primaryButton} href={observatoryHref(observatoryLocale)}>
              {copy.exploreDemos} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <ModelField />
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}><span /> {copy.eyebrow}</div>
          <h1>{copy.heroTitle} <em>{copy.heroAccent}</em></h1>
          <p>{copy.heroBody}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButtonLarge} href={observatoryHref(observatoryLocale)}>
              <Play fill="currentColor" size={16} /> {copy.exploreDemos}
            </Link>
            <Link className={styles.secondaryButton} href={studioHref()}>
              {copy.buildStudio} <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.heroProof}><ShieldCheck size={17} /> {copy.heroProof}</div>
        </div>

        <div className={styles.heroVisual} aria-label="QDIP decision trace preview">
          <div className={styles.visualTopbar}>
            <span>{copy.trace.title}</span>
            <span className={styles.liveIndicator}>{copy.trace.online}</span>
          </div>
          <div className={styles.visualBody}>
            <div className={styles.stateHeader}>
              <div><small>{copy.trace.state}</small><strong>{copy.trace.disruption}</strong></div>
              <div className={styles.confidenceRing}><span>87%</span><small>{copy.trace.confidence}</small></div>
            </div>
            <div className={styles.traceFlow}>
              {[CircleGauge, GitBranch, Scale, Check].map((Icon, index) => (
                <Fragment key={copy.trace.steps[index]}>
                  {index > 0 && <b />}
                  <div className={styles.flowStep} data-active="true">
                    <i><Icon size={16} /></i><span>{copy.trace.steps[index]}</span>
                  </div>
                </Fragment>
              ))}
            </div>
            <div className={styles.alternatives}>
              <div><span><i className={styles.signalDot} /> {copy.trace.reroute}</span><strong>82.4</strong><small>{copy.trace.recommended}</small></div>
              <div><span><i className={styles.amberDot} /> {copy.trace.hold}</span><strong>61.8</strong><small>{copy.trace.higherRisk}</small></div>
            </div>
            <div className={styles.explanation}>
              <Sparkles size={17} />
              <p><strong>{copy.trace.why}</strong>{copy.trace.explanation}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.proofStrip} aria-label="Platform qualities">
        <span>{copy.proof[0]}</span>
        {copy.proof.slice(1).map((item) => <div key={item}><Check size={15} /> {item}</div>)}
      </section>

      <section className={styles.problem}>
        <div className={styles.problemGrid}>
          <div>
            <div className={styles.darkEyebrow}>{copy.problem.label}</div>
            <h2>{copy.problem.lines[0]}<br />{copy.problem.lines[1]}<br /><span>{copy.problem.lines[2]}</span></h2>
          </div>
          <div className={styles.problemAnswer}>
            <div className={styles.darkEyebrow}>{copy.problem.shift}</div>
            <h3>{copy.problem.answer}</h3>
            <div className={styles.answerRows}>
              {copy.problem.rows.map((item, index) => <div key={item}><strong>0{index + 1}</strong><span>{item}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.platform} id="platform">
        <div className={styles.sectionIntro}>
          <div className={styles.eyebrow}><span /> {copy.platform.eyebrow}</div>
          <h2>{copy.platform.title}</h2>
          <p>{copy.platform.body}</p>
        </div>
        <div className={styles.platformLayers} id="products">
          {copy.platform.layers.map((layer, index) => {
            const Icon = [Braces, SlidersHorizontal, Eye][index];
            const href = index === 1 ? studioHref() : observatoryHref(observatoryLocale);
            return (
              <article className={styles.layerCard} key={layer.label}>
                <div className={styles.layerNumber}>0{index + 1}</div>
                <div className={styles.layerIcon}><Icon size={24} /></div>
                <div>
                  <span>{layer.label}</span><h3>{layer.title}</h3><p>{layer.description}</p>
                  <ul>{layer.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                  {layer.link && <Link href={href}>{layer.link} <ArrowRight size={15} /></Link>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.demoSection} id="demos">
        <div className={styles.demoHeading}>
          <div><div className={styles.eyebrow}><span /> {copy.demos.eyebrow}</div><h2>{copy.demos.title}</h2></div>
          <p>{copy.demos.body}</p>
        </div>
        <div className={styles.demoGrid}>
          {copy.demos.items.map((item, index) => {
            const meta = demoMeta[index];
            const Icon = meta.icon;
            return (
              <Link className={styles.demoCard} data-accent={meta.accent} href={observatoryHref(`${observatoryLocale}/${meta.path}`)} key={item.title}>
                <div className={styles.demoCardTop}><span className={styles.demoIcon}><Icon size={20} /></span><span>{item.domain}</span></div>
                <h3>{item.title}</h3><p>{item.description}</p>
                <div className={styles.demoLink}>{copy.demos.run} <ArrowRight size={16} /></div>
              </Link>
            );
          })}
        </div>
        <div className={styles.allDemos}>
          <Link className={styles.secondaryButtonDark} href={observatoryHref(observatoryLocale)}>{copy.demos.all} <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className={styles.trust} id="trust">
        <div className={styles.trustLead}>
          <div className={styles.eyebrow}><span /> {copy.trust.eyebrow}</div>
          <h2>{copy.trust.title}</h2><p>{copy.trust.body}</p>
          <div className={styles.trustBadge}><ShieldCheck size={20} /> {copy.trust.badge}</div>
        </div>
        <div className={styles.capabilityGrid}>
          {copy.trust.capabilities.map((capability, index) => {
            const Icon = capabilityIcons[index];
            return <article key={capability.title}><Icon size={21} /><h3>{capability.title}</h3><p>{capability.description}</p></article>;
          })}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div aria-hidden="true" className={styles.ctaGlow} />
        <div><Globe2 size={28} /><h2>{copy.cta.title}</h2><p>{copy.cta.body}</p></div>
        <div className={styles.ctaActions}>
          <Link className={styles.primaryButtonLarge} href={observatoryHref(observatoryLocale)}>{copy.cta.observatory} <ArrowRight size={16} /></Link>
          <Link className={styles.darkTextLink} href={studioHref()}>{copy.cta.studio} <ChevronRight size={16} /></Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <nav aria-label="Footer navigation">
          <Link href={studioHref()}>Studio</Link><Link href={observatoryHref(observatoryLocale)}>Observatory</Link>
          <a href="#demos">{copy.nav[2]}</a><a href="#platform">{copy.nav[0]}</a>
        </nav>
        <span>© {new Date().getFullYear()} QDIP</span>
      </footer>
    </main>
  );
}
