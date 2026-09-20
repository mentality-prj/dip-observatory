import Link from "next/link";
import { ArrowRight, Check, Play } from "lucide-react";
import { marketingLocaleHref, observatoryHref } from "@/lib/platform-urls";
import { marketingCopy, marketingLocales, type MarketingLocale } from "./qdip-copy";
import { QdipLogo } from "./qdip-logo";
import { MobileMenu } from "./mobile-menu";
import styles from "./qdip-site.module.css";

const localeLabels: Record<MarketingLocale, string> = { en: "EN", uk: "UA", pl: "PL" };
const path = (locale: MarketingLocale, slug: string) => `${marketingLocaleHref(locale)}/${slug}`;

function Header({ locale }: { locale: MarketingLocale }) {
  const c=marketingCopy[locale];
  const items=[{href:path(locale,"how-it-works"),label:c.nav[0]},{href:path(locale,"use-cases"),label:c.nav[1]},{href:"#why",label:c.nav[2]},{href:path(locale,"core"),label:c.nav[3]},{href:path(locale,"use-cases"),label:c.nav[4]}];
  return <header className={styles.header}><div className={styles.headerInner}><Link className={styles.brand} href={marketingLocaleHref(locale)}><QdipLogo/></Link><nav aria-label="Primary navigation" className={styles.nav}>{items.map(item=><Link href={item.href} key={`${item.href}-${item.label}`}>{item.label}</Link>)}</nav><div className={styles.headerTools}><nav aria-label="Language" className={styles.languageNav}>{marketingLocales.map(l=><a aria-current={locale===l?"page":undefined} href={marketingLocaleHref(l)} key={l}>{localeLabels[l]}</a>)}</nav><MobileMenu items={items}/></div></div></header>;
}
function Flow({labels}:{labels:readonly string[]}){return <div className={styles.flow} aria-label={labels.join(" to ")}>{labels.map((label,index)=><div className={styles.flowPart} key={`${label}-${index}`}><span className={styles.flowNode}>{label}</span>{index<labels.length-1&&<span className={styles.flowConnector} aria-hidden="true"><ArrowRight size={18}/></span>}</div>)}</div>}
function DecisionEngineDiagram({labels}:{labels:readonly string[]}){return <div className={styles.heroVisual} aria-label={labels.join(" to ")}><div className={styles.inputCloud}>{labels.slice(0,4).map(x=><span key={x}>{x}</span>)}</div><span className={styles.diagramConnector} aria-hidden="true"><ArrowRight size={20}/></span><div className={styles.engine}>QDIP<small>{labels[4]}</small></div><span className={styles.diagramConnector} aria-hidden="true"><ArrowRight size={20}/></span><div className={styles.output}>{labels[5]}<small>+ {labels[6]}</small></div><span className={styles.diagramConnector} aria-hidden="true"><ArrowRight size={20}/></span><div className={styles.person}>{labels[7]}</div></div>}

export function QdipSite({locale="en"}:{locale?:MarketingLocale}){
  const c=marketingCopy[locale]; const ol=locale==="uk"?"en":locale;
  return <main className={styles.site} id="main-content" lang={locale}><Header locale={locale}/>
    <section className={styles.hero}><div className={styles.heroCopy}><div className={styles.eyebrow}>{c.hero[0]}</div><h1>{c.hero[1]}</h1><p className={styles.lead}>{c.hero[2]}</p><p>{c.hero[3]}</p><strong className={styles.human}>{c.hero[4]}</strong><div className={styles.heroActions}><Link className={styles.primaryButtonLarge} href={path(locale,"use-cases")}><Play size={16}/>{c.hero[5]}</Link></div></div><DecisionEngineDiagram labels={c.diagram}/></section>
    <section className={styles.section}><div className={styles.sectionIntro}><h2>{c.problem[0]}</h2></div><div className={styles.questionGrid}>{c.problem.slice(1,5).map(x=><article key={x}>{x}</article>)}</div><p className={styles.centerCopy}>{c.problem[5]} <strong>{c.problem[6]}</strong></p><p className={styles.businessBridge}>{c.bridge}</p></section>
    <section className={styles.darkSection}><div className={styles.compareGrid}><article><span>{c.compare[0]}</span><Flow labels={[c.diagram[0],locale==="en"?"Rules / priorities":locale==="uk"?"Правила / пріоритети":"Reguły / priorytety",locale==="en"?"Compare options":locale==="uk"?"Порівняння варіантів":"Porównanie opcji",locale==="en"?"Human reasoning":locale==="uk"?"Людське міркування":"Ocena człowieka",locale==="en"?"Decision":locale==="uk"?"Рішення":"Decyzja"]}/><p>{c.compare[1]}</p></article><article><span>{c.compare[2]}</span><Flow labels={[`${c.diagram[0]} + ${c.diagram[1]}`,"QDIP",locale==="en"?"Evaluation":locale==="uk"?"Оцінювання":"Ocena",`${c.diagram[5]} + ${c.diagram[6]}`,c.diagram[7]]}/><p>{c.compare[3]}</p></article></div></section>
    <section className={styles.section}><div className={styles.sectionIntro}><div className={styles.eyebrow}>{c.how[0]}</div><h2>{c.how[0]}</h2></div><Flow labels={c.how.slice(1,6)}/><div className={styles.centerAction}><Link className={styles.secondaryButton} href={path(locale,"how-it-works")}>{c.how[6]} <ArrowRight size={16}/></Link></div></section>
    <section className={styles.section}><div className={styles.sectionIntro}><h2>{c.cases[0]}</h2></div><div className={styles.caseGrid}><article className={styles.featuredCase}><span>{c.cases[1]}</span><h3>{c.cases[2]}</h3><strong>{c.cases[3]}</strong><p>{c.cases[4]}</p><Link href={observatoryHref(`${ol}/resource-allocation`)}>{c.cases[5]} <ArrowRight size={15}/></Link></article><article><span>{c.cases[6]}</span><h3>{c.cases[7]}</h3><strong>{c.cases[8]}</strong><p>{c.cases[9]}</p><Link href={observatoryHref(`${ol}/gas-forecast`)}>{c.cases[10]} <ArrowRight size={15}/></Link></article><article><span>{c.cases[11]}</span><h3>{c.cases[12]}</h3><strong>{c.cases[13]}</strong><p className={styles.comingSoon}>{c.cases[14]}</p></article></div></section>
    <section className={styles.softSection} id="why"><div className={styles.sectionIntro}><h2>{c.why[0]}</h2></div><div className={styles.valueGrid}>{[1,3,5,7,9,11].map(i=><article key={c.why[i]}><Check size={18}/><h3>{c.why[i]}</h3><p>{c.why[i+1]}</p></article>)}</div></section>
    <section className={`${styles.section} ${styles.adoptionSection}`}><div className={styles.sectionIntro}><h2>{c.adoption[0]}</h2></div><Flow labels={c.adoption.slice(1)}/></section>
    <section className={styles.finalCta}><h2>{c.conversion[0]}</h2><p>{c.conversion[1]}</p><Link className={styles.primaryButtonLarge} href={path(locale,"decision")}>{c.conversion[2]} <ArrowRight size={16}/></Link></section>
    <footer className={styles.footer}><QdipLogo/><nav><Link href={path(locale,"how-it-works")}>{c.nav[0]}</Link><Link href={path(locale,"use-cases")}>{c.nav[1]}</Link><Link href={path(locale,"core")}>QDIP Core</Link><Link href={path(locale,"core/research")}>Research</Link></nav><span>© {new Date().getFullYear()} QDIP</span></footer>
  </main>;
}
