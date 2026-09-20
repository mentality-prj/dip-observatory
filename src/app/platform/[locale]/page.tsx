import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marketingLocales, type MarketingLocale } from "@/components/marketing/qdip-copy";
import { QdipSite } from "@/components/marketing/qdip-site";
import { QDIP_DEFAULT_LOCALE,QDIP_OG_LOCALE,qdipLocaleUrl } from "@/app/seo-copy";
const metadataByLocale:Record<MarketingLocale,{title:string;description:string}>={
 en:{title:"QDIP — Decision Engine for consistent, explainable decisions",description:"Evaluate recurring decisions consistently when priorities, constraints and information change. QDIP provides a recommendation with supporting evidence; your team makes the final decision."},
 uk:{title:"QDIP — рушій для послідовних і зрозуміло обґрунтованих рішень",description:"QDIP допомагає послідовно оцінювати регулярні рішення, коли змінюються пріоритети, обмеження та інформація. QDIP надає рекомендацію з обґрунтуванням, а остаточне рішення приймає ваша команда."},
 pl:{title:"QDIP — silnik decyzyjny do spójnych i zrozumiale uzasadnionych decyzji",description:"QDIP pomaga spójnie oceniać regularnie podejmowane decyzje, gdy zmieniają się priorytety, ograniczenia i informacje. QDIP przedstawia rekomendację z uzasadnieniem, a ostateczną decyzję podejmuje Twój zespół."}
};
function isMarketingLocale(locale:string):locale is MarketingLocale{return marketingLocales.includes(locale as MarketingLocale)}
export function generateStaticParams(){return marketingLocales.map(locale=>({locale}))}
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const{locale}=await params;if(!isMarketingLocale(locale))return{};const v=metadataByLocale[locale];const canonical=qdipLocaleUrl(locale);return{title:{absolute:v.title},description:v.description,alternates:{canonical,languages:{en:qdipLocaleUrl("en"),uk:qdipLocaleUrl("uk"),pl:qdipLocaleUrl("pl"),"x-default":qdipLocaleUrl(QDIP_DEFAULT_LOCALE)}},openGraph:{title:v.title,description:v.description,url:canonical,siteName:"QDIP",type:"website",locale:QDIP_OG_LOCALE[locale]}}}
export default async function LocalizedPlatformPage({params}:{params:Promise<{locale:string}>}){const{locale}=await params;if(!isMarketingLocale(locale))notFound();return <QdipSite locale={locale}/>}
