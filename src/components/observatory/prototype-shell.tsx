"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { ChevronRight, Home, Menu, Network } from "lucide-react";

import { buildLocalePath, SUPPORTED_LOCALES, type Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type PrototypeShellProps = { locale: Locale; children: React.ReactNode; theme?: "cyan" | "violet" | "amber" | "emerald" | "rose" };
type PrototypeNavItem = { href: string; label: Record<Locale, string>; short: string };

const NAV_ITEMS: PrototypeNavItem[] = [
  { href: "/", label: { en: "Observatory", uk: "Observatory", pl: "Observatory" }, short: "OBS" },
  { href: "/eidos", label: { en: "EIDOS", uk: "EIDOS", pl: "EIDOS" }, short: "EID" },
  { href: "/production-replanning", label: { en: "Production Replanning", uk: "Перепланування", pl: "Przeplanowanie" }, short: "REP" },
  { href: "/production-scheduling", label: { en: "Production Scheduling", uk: "Планування виробництва", pl: "Planowanie produkcji" }, short: "SCH" },
  { href: "/supplier-decision", label: { en: "Supplier Decision", uk: "Вибір постачальника", pl: "Wybór dostawcy" }, short: "SUP" },
  { href: "/wsp-demand-forecast", label: { en: "WSP Demand Forecast", uk: "WSP прогноз попиту", pl: "WSP prognoza popytu" }, short: "WSP" },
];

const THEME_CLASS = {
  cyan: "text-cyan-300 bg-cyan-300/10 border-cyan-300/20",
  violet: "text-violet-300 bg-violet-300/10 border-violet-300/20",
  amber: "text-amber-300 bg-amber-300/10 border-amber-300/20",
  emerald: "text-emerald-300 bg-emerald-300/10 border-emerald-300/20",
  rose: "text-rose-300 bg-rose-300/10 border-rose-300/20",
} as const;

export function PrototypeShell({ locale, children, theme = "cyan" }: PrototypeShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const activeNavRef = useRef<HTMLAnchorElement>(null);
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const themeClass = THEME_CLASS[theme];

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [normalizedPath]);

  function changeLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => router.replace(buildLocalePath(normalizedPath, next)));
  }

  const activeItem = NAV_ITEMS.find((item) => normalizedPath === item.href || (item.href !== "/" && normalizedPath.startsWith(`${item.href}/`)));

  return (
    <div className="min-h-screen bg-transparent text-white" data-prototype-theme={theme}>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1700px] items-center gap-4 px-4 md:px-6 xl:px-10">
          <Link href={buildLocalePath("/", locale)} className="group flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-2 outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-cyan-300/60" aria-label="DIP Observatory home">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-cyan-300"><Network className="h-4 w-4" /></span>
            <span className="hidden text-sm font-semibold tracking-tight sm:block">DIP Observatory</span>
          </Link>
          <div className="hidden h-6 w-px shrink-0 bg-white/10 lg:block" />
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 lg:flex" aria-label="Prototype navigation" style={{ scrollbarWidth: "none" }}>
            {NAV_ITEMS.map((item) => {
              const active = normalizedPath === item.href || (item.href !== "/" && normalizedPath.startsWith(`${item.href}/`));
              return <Link ref={active ? activeNavRef : undefined} key={item.href} href={buildLocalePath(item.href, locale)} className={cn("flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-xs font-medium leading-none transition", active ? cn(themeClass) : "text-slate-500 hover:bg-white/5 hover:text-slate-200")}><span className="w-7 text-center font-mono text-[9px] leading-none opacity-50">{item.short}</span><span className="whitespace-nowrap">{item.label[locale]}</span></Link>;
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] p-1 md:flex">
              {SUPPORTED_LOCALES.map((option) => <button key={option} type="button" disabled={pending} onClick={() => changeLocale(option)} className={cn("rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition", option === locale ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-300")}>{option}</button>)}
            </div>
            <Menu className="h-5 w-5 text-slate-400 lg:hidden" />
          </div>
        </div>
        <div className="border-t border-white/5 lg:hidden"><div className="mx-auto flex w-full max-w-[1700px] gap-1 overflow-x-auto px-4 py-2 md:px-6" style={{ scrollbarWidth: "none" }}>
          {NAV_ITEMS.map((item) => { const active = normalizedPath === item.href || (item.href !== "/" && normalizedPath.startsWith(`${item.href}/`)); return <Link key={item.href} href={buildLocalePath(item.href, locale)} className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-medium transition", active ? themeClass : "border-transparent text-slate-600 hover:bg-white/5 hover:text-slate-300")}><span className="font-mono opacity-50">{item.short}</span><span className="whitespace-nowrap">{item.label[locale]}</span></Link>; })}
        </div></div>
      </header>
      <div className="mx-auto w-full max-w-[1700px] px-0">
        <div className="flex h-8 items-center gap-1 px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 md:px-6 xl:px-10" aria-label="Breadcrumb">
          <Home className="h-3 w-3 shrink-0 text-slate-600" />
          <ChevronRight className="h-3 w-3 shrink-0 text-slate-700" />
          <span className="truncate">{activeItem?.label[locale] ?? "Prototype"}</span>
        </div>
        <div className="prototype-shell-content">{children}</div>
      </div>
    </div>
  );
}
