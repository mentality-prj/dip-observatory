import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DesignSystemProvider } from "@/design-system";
import { marketingLocaleHref } from "@/lib/platform-urls";
import { QdipLogo } from "../qdip-logo";
import { LanguageSwitcher } from "../language-switcher";
import type { MarketingLocale } from "../qdip-copy";
import { getDepthContent, type DepthPageKey } from "./content";
import styles from "./depth-page.module.css";

const localeHref=(l:MarketingLocale,path:string)=>`${marketingLocaleHref(l)}/${path}`;
const demoHref=(l:MarketingLocale,path:string)=>`${marketingLocaleHref(l)}${path}`;
const paths=["how-it-works","use-cases","core","core/research"] as const;

export function DepthPage({locale,page}:{locale:MarketingLocale;page:DepthPageKey}){
 const c=getDepthContent(locale,page);
 return <DesignSystemProvider theme="rose" mode="light" className={styles.page}><main id="main-content">
  <header className={styles.header}><Link href={marketingLocaleHref(locale)} aria-label="QDIP home"><QdipLogo/></Link><nav className={styles.primaryNav}>{c.nav.map((x,i)=><Link key={x} className={paths[i]===page?styles.active:undefined} href={localeHref(locale,paths[i])}>{x}</Link>)}</nav><div className={styles.headerTools}><LanguageSwitcher locale={locale} hrefForLocale={(l)=>localeHref(l,page)}/><Link className={styles.demo} href={localeHref(locale,"use-cases#demos")}>Demos <ArrowRight size={14}/></Link></div></header>
  <section className={styles.hero}><div className={styles.eyebrow}>{c.hero[0]}</div><h1>{c.hero[1]}</h1><p>{c.hero[2]}</p><div className={styles.heroActions}><Link className={styles.primary} href={localeHref(locale,"use-cases#demos")}>Explore working demos <ArrowRight size={15}/></Link><Link className={styles.secondary} href={localeHref(locale,"decision")}>Describe your decision</Link></div></section>
  {c.cases&&<section id="demos" className={styles.cases}>{c.cases.map(x=><article key={x.title} className={styles.case}><div className={styles.pattern}>{x.pattern}</div><h2>{x.title}</h2><h3>{x.question}</h3><p>{x.problem}</p><dl><div><dt>INPUTS</dt><dd>{x.inputs}</dd></div><div><dt>EVALUATION</dt><dd>{x.evaluation}</dd></div><div><dt>OUTPUT</dt><dd>{x.output}</dd></div></dl><Link href={demoHref(locale,x.href)}>Open {x.title} <ArrowRight size={14}/></Link></article>)}</section>}
  <div className={styles.sections}>{c.sections.map((s,index)=><section key={s.title} className={styles.section}><div className={styles.sectionIndex}>0{index+1}</div><div className={styles.sectionCopy}>{s.eyebrow&&<div className={styles.eyebrow}>{s.eyebrow}</div>}<h2>{s.title}</h2><p>{s.body}</p>{s.items&&<div className={styles.items}>{s.items.map(i=><article key={i.title}><CheckCircle2 size={17}/><div><h3>{i.title}</h3><p>{i.body}</p></div></article>)}</div>}</div></section>)}</div>
  <section className={styles.cta}><div><div className={styles.eyebrow}>NEXT STEP</div><h2>{c.cta[0]}</h2><p>{c.cta[1]}</p></div><Link className={styles.primary} href={page==="core"?localeHref(locale,"core/research"):localeHref(locale,"decision")}>{c.cta[2]} <ArrowRight size={15}/></Link></section>
  <footer className={styles.footer}><Link href={marketingLocaleHref(locale)} aria-label="QDIP home"><QdipLogo/></Link><nav aria-label="Footer navigation"><Link href={localeHref(locale,"how-it-works")}>{c.nav[0]}</Link><Link href={localeHref(locale,"use-cases")}>{c.nav[1]}</Link><Link href={localeHref(locale,"core")}>{c.nav[2]}</Link><Link href={localeHref(locale,"core/research")}>{c.nav[3]}</Link></nav><span>© {new Date().getFullYear()} QDIP</span></footer>
 </main></DesignSystemProvider>
}
