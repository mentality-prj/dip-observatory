"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { ChevronRight, Home } from "lucide-react";
import { DesignSystemProvider, ProductHeader, type DesignTheme } from "@/design-system";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";
import { studioHref } from "@/lib/platform-urls";
import { observableUseCases, type UseCaseTheme } from "@/use-cases/registry";

export type PrototypeTheme = UseCaseTheme;
type PrototypeShellProps = { locale: Locale; children: React.ReactNode; theme?: PrototypeTheme };
const LOCALES: Locale[] = ["en", "uk", "pl"];
const LABEL: Record<Locale,string> = { en:"EN", pl:"PL", uk:"UA" };
const STUDIO_LABEL: Record<Locale,string> = { en:"Configure in Studio", uk:"Налаштувати в Studio", pl:"Konfiguruj w Studio" };

export function PrototypeShell({ locale, children, theme = "cyan" }: PrototypeShellProps) {
  const pathname=usePathname(); const router=useRouter(); const [pending,startTransition]=useTransition(); const activeNavRef=useRef<HTMLAnchorElement>(null);
  const normalizedPath=pathname.replace(new RegExp(`^/${locale}`),"")||"/"; const navItems=observableUseCases();
  const isActive=(href:string)=>normalizedPath===href||normalizedPath.startsWith(`${href}/`); const activeItem=navItems.find(item=>isActive(item.route));
  useEffect(()=>activeNavRef.current?.scrollIntoView({block:"nearest",inline:"nearest"}),[normalizedPath]);
  const changeLocale=(next:Locale)=>{if(next!==locale)startTransition(()=>router.replace(buildLocalePath(normalizedPath,next)))};
  const nav=<nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Observatory applications">{navItems.map(item=>{const active=isActive(item.route);return <Link ref={active?activeNavRef:undefined} key={item.id} href={buildLocalePath(item.route,locale)} aria-current={active?"page":undefined} className={cn("flex min-h-10 shrink-0 items-center rounded-lg border px-3 text-sm font-medium transition",active?"border-[rgb(var(--ds-accent-rgb)/.25)] bg-[rgb(var(--ds-accent-rgb)/.08)] text-[var(--ds-accent)]":"border-transparent text-slate-400 hover:bg-white/5 hover:text-white")}>{item.title[locale]}</Link>})}</nav>;
  const utilities=<div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[.03] p-1" aria-label="Language">{LOCALES.map(option=><button key={option} type="button" disabled={pending} onClick={()=>changeLocale(option)} aria-current={option===locale?"page":undefined} className={cn("min-h-8 rounded-md px-2 text-xs font-semibold",option===locale?"bg-white/10 text-white":"text-slate-500 hover:text-slate-200")}>{LABEL[option]}</button>)}</div>;
  return <DesignSystemProvider theme={theme as DesignTheme} className="observatory-shell text-white">
    <ProductHeader
      href={buildLocalePath("/",locale)}
      product="Observatory"
      navigation={<div className="hidden min-w-0 flex-1 lg:flex">{nav}</div>}
      productSwitch={{ href: studioHref(), label: STUDIO_LABEL[locale] }}
      utilities={utilities}
    />
    <div className="border-b border-white/5 px-4 py-2 lg:hidden">{nav}</div>
    <div className="observatory-stage mx-auto w-full max-w-[1700px]">
      <div className="flex h-11 items-center gap-1 px-4 text-xs font-medium uppercase tracking-[.14em] text-slate-400 md:px-6 xl:px-10" aria-label="Breadcrumb"><Home className="h-3 w-3"/><ChevronRight className="h-3 w-3 text-slate-600"/><span className="truncate">{activeItem?.title[locale]??"Observatory"}</span></div>
      <div className="prototype-shell-content" id="main-content" tabIndex={-1}>{children}</div>
    </div>
  </DesignSystemProvider>;
}
