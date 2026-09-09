"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronRight, Home, Menu, Network, SlidersHorizontal } from "lucide-react";

import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";

type PrototypeShellProps = { locale: Locale; children: React.ReactNode; theme?: "cyan" | "violet" | "amber" | "emerald" | "rose" };
type PrototypeNavItem = { href: string; label: Record<Locale, string>; short: string };

const GENERAL_NAV_ITEMS: PrototypeNavItem[] = [
  { href: "/", label: { en: "Observatory", uk: "Observatory", pl: "Observatory" }, short: "OBS" },
  { href: "/gas-forecast", label: { en: "Gas Forecast", uk: "Прогноз газу", pl: "Prognoza gazu" }, short: "GAS" },
  { href: "/production-decision", label: { en: "Production Decision", uk: "Виробничі рішення", pl: "Decyzje produkcyjne" }, short: "DEC" },
  { href: "/production-replanning", label: { en: "Production Replanning", uk: "Перепланування", pl: "Przeplanowanie" }, short: "REP" },
  { href: "/production-scheduling", label: { en: "Production Scheduling", uk: "Планування виробництва", pl: "Planowanie produkcji" }, short: "SCH" },
  { href: "/supplier-decision", label: { en: "Supplier Decision", uk: "Вибір постачальника", pl: "Wybór dostawcy" }, short: "SUP" },
];

const COMPANY_NAV_ITEMS: PrototypeNavItem[] = [
  { href: "/wsp-demand-forecast", label: { en: "WSP Demand Forecast", uk: "WSP прогноз попиту", pl: "WSP prognoza popytu" }, short: "WSP" },
  { href: "/vive-production-intelligence", label: { en: "VIVE Production Intelligence", uk: "VIVE виробнича інтелігенція", pl: "VIVE Production Intelligence" }, short: "VIVE" },
];

const LOCALE_SWITCHER: Locale[] = ["en", "pl", "uk"];
const LOCALE_SHORT_LABEL: Record<Locale, string> = { en: "EN", pl: "PL", uk: "UA" };

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
  const [showCompanyPrototypes, setShowCompanyPrototypes] = useState(false);
  const activeNavRef = useRef<HTMLAnchorElement>(null);
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const themeClass = THEME_CLASS[theme];
  const navItems = showCompanyPrototypes ? [...GENERAL_NAV_ITEMS, ...COMPANY_NAV_ITEMS] : GENERAL_NAV_ITEMS;

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [normalizedPath]);

  function changeLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => router.replace(buildLocalePath(normalizedPath, next)));
  }

  const activeItem = [...GENERAL_NAV_ITEMS, ...COMPANY_NAV_ITEMS].find(
    (item) => normalizedPath === item.href || (item.href !== "/" && normalizedPath.startsWith(`${item.href}/`)),
  );

  function renderNav(items: PrototypeNavItem[]) {
    return items.map((item) => {
      const active = normalizedPath === item.href || (item.href !== "/" && normalizedPath.startsWith(`${item.href}/`));
      return (
        <Link
          ref={active ? activeNavRef : undefined}
          key={item.href}
          href={buildLocalePath(item.href, locale)}
          className={cn(
            "flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-transparent px-2.5 text-xs font-medium leading-none transition",
            active ? cn(themeClass) : "text-slate-500 hover:bg-white/5 hover:text-slate-200",
          )}
        >
          <span className="w-7 text-center font-mono text-[9px] leading-none opacity-50">{item.short}</span>
          <span className="whitespace-nowrap">{item.label[locale]}</span>
        </Link>
      );
    });
  }

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
            {renderNav(navItems)}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCompanyPrototypes((current) => !current)}
                aria-label="Toggle company prototypes"
                aria-pressed={showCompanyPrototypes}
                title="Company prototypes"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg border text-slate-500 transition hover:bg-white/5 hover:text-slate-200",
                  showCompanyPrototypes ? themeClass : "border-white/8 bg-white/[0.03]",
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {showCompanyPrototypes && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-2xl shadow-black/40">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Prototype visibility</div>
                  <div className="mt-2 text-xs text-slate-300">Company prototypes</div>
                  <div className="mt-1 text-[11px] leading-5 text-slate-500">WSP and VIVE are shown while this control is active.</div>
                </div>
              )}
            </div>
            <div className="hidden items-center gap-1 rounded-lg border border-white/8 bg-white/[0.03] p-1 md:flex">
              {LOCALE_SWITCHER.map((option) => <button key={option} type="button" disabled={pending} onClick={() => changeLocale(option)} className={cn("rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider leading-none transition", option === locale ? "bg-white/10 text-white" : "text-slate-600 hover:text-slate-300")}>{LOCALE_SHORT_LABEL[option]}</button>)}
            </div>
            <Menu className="h-5 w-5 text-slate-400 lg:hidden" />
          </div>
        </div>
        <div className="border-t border-white/5 lg:hidden"><div className="mx-auto flex w-full max-w-[1700px] gap-1 overflow-x-auto px-4 py-2 md:px-6" style={{ scrollbarWidth: "none" }}>
          {renderNav(navItems).map((item) => item)}
        </div></div>
      </header>
      <div className="mx-auto w-full max-w-[1700px] px-0">
        <div className="flex h-10 items-center gap-1 px-4 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500 leading-none md:px-6 xl:px-10" aria-label="Breadcrumb">
          <Home className="relative -top-px h-3 w-3 shrink-0 text-slate-600" />
          <ChevronRight className="relative -top-px h-3 w-3 shrink-0 text-slate-700" />
          <span className="truncate leading-none">{activeItem?.label[locale] ?? "Prototype"}</span>
        </div>
        <div className="prototype-shell-content">{children}</div>
      </div>
    </div>
  );
}
