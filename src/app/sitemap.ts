import type { MetadataRoute } from "next";

const SITE="https://qdip.ai";
const locales=["en","uk","pl"] as const;
const pages=["","how-it-works","use-cases","decision","core","core/architecture","core/decision-model","core/explainability","core/research"] as const;

export default function sitemap():MetadataRoute.Sitemap{
 return locales.flatMap(locale=>pages.map(page=>({
  url:`${SITE}/${locale}${page?`/${page}`:""}`,
  changeFrequency:page.startsWith("core")?"monthly":"weekly" as const,
  priority:page===""?1:page==="decision"?0.9:0.8,
  alternates:{languages:Object.fromEntries(locales.map(l=>[l,`${SITE}/${l}${page?`/${page}`:""}`]))},
 })));
}
