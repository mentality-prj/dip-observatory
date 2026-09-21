import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { marketingLocaleHref } from "@/lib/platform-urls";
import { marketingCopy, type MarketingLocale } from "./qdip-copy";
import { QdipLogo } from "./qdip-logo";
import { MobileMenu } from "./mobile-menu";
import { LanguageSwitcher } from "./language-switcher";
import { DecisionSpace } from "./decision-space";
import { DecisionPatterns } from "./decision-patterns";
import { DecisionPlayground } from "./decision-playground";
import { ProductJourney } from "./product-journey";
import { PilotPath } from "./pilot-path";
import { conversionBridgeCopy } from "./conversion-copy";
import styles from "./qdip-site.module.css";

const path = (locale: MarketingLocale, slug: string) => `${marketingLocaleHref(locale)}/${slug}`;

function Header({ locale }: { locale: MarketingLocale }) {
  const c=marketingCopy[locale];
  const items=[{href:path(locale,"how-it-works"),label:c.nav[0]},{href:path(locale,"use-cases"),label:c.nav[1]},{href:"#why",label:c.nav[2]},{href:path(locale,"core"),label:c.nav[3]},{href:`${path(locale,"use-cases")}#demos`,label:c.nav[4]}];
  return <header className={styles.header}><div className={styles.headerInner}><Link className={styles.brand} href={marketingLocaleHref(locale)}><QdipLogo/></Link><nav aria-label="Primary navigation" className={styles.nav}>{items.map(item=><Link href={item.href} key={`${item.href}-${item.label}`}>{item.label}</Link>)}</nav><div className={styles.headerTools}><LanguageSwitcher locale={locale} hrefForLocale={marketingLocaleHref}/><MobileMenu items={items}/></div></div></header>;
}

export function QdipSite({locale="en"}:{locale?:MarketingLocale}){
  const c=marketingCopy[locale]; const valueIndexes=[1,3,11,5,7,9]; const decisionHref=path(locale,"decision");
  return <main className={styles.site} id="main-content" lang={locale}><Header locale={locale}/>
    <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.eyebrow}>{c.hero[0]}</div><h1>{c.hero[1]}</h1><p className={styles.lead}>{c.hero[2]}</p><p>{c.hero[3]}</p><strong className={styles.human}>{c.hero[4]}</strong><div className={styles.heroActions}><Link className={styles.primaryButtonLarge} href={path(locale,"use-cases")}><Play size={16}/>{c.hero[5]}</Link></div></div><DecisionSpace locale={locale}/></section>
    <section className={styles.section}><div className={styles.sectionIntro}><h2>{c.problem[0]}</h2></div><div className={styles.questionGrid}>{c.problem.slice(1,5).map(x=><article key={x}>{x}</article>)}</div><p className={styles.centerCopy}>{c.problem[5]} <strong>{c.problem[6]}</strong></p><p className={styles.businessBridge}>{c.bridge}</p></section>
    <DecisionPlayground locale={locale}/>
    <section className={`${styles.section} ${styles.patternSection}`} id="demos"><div className={styles.sectionIntro}><div className={styles.eyebrow}>ALLOCATE · DECIDE · PRIORITIZE</div><h2>{c.cases[0]}</h2></div><DecisionPatterns locale={locale} cases={c.cases}/><div className={styles.demoBridge}><span>{conversionBridgeCopy[locale].question}</span><Link href={decisionHref}>{c.conversion[2]} <ArrowRight size={14}/></Link></div></section>
    <ProductJourney locale={locale} demoHref="#demos" coreHref={path(locale,"core")}/>
    <section className={styles.softSection} id="why"><div className={styles.sectionIntro}><h2>{c.why[0]}</h2></div><div className={styles.valueGrid}>{valueIndexes.map((i,index)=><article className={index<3?styles.featuredCase:undefined} key={c.why[i]}><Check size={18}/><h3>{c.why[i]}</h3><p>{c.why[i+1]}</p></article>)}</div></section>
    <PilotPath locale={locale} decisionHref={decisionHref}/>
    <section className={styles.finalCta}><h2>{c.conversion[0]}</h2><p>{c.conversion[1]}</p><Link className={styles.primaryButtonLarge} href={decisionHref}>{c.conversion[2]} <ArrowRight size={16}/></Link></section>
    <footer className={styles.footer}><QdipLogo/><nav><Link href={path(locale,"how-it-works")}>{c.nav[0]}</Link><Link href={path(locale,"use-cases")}>{c.nav[1]}</Link><Link href={path(locale,"core")}>QDIP Core</Link><Link href={path(locale,"core/research")}>Research</Link></nav><span>© {new Date().getFullYear()} QDIP</span></footer>
  </main>;
}