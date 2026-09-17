"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { ChevronRight, Home } from "lucide-react";

import { ProductLockup } from "@/components/platform/product-lockup";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";
import { cn } from "@/lib/utils";
import { studioHref } from "@/lib/platform-urls";
import { observableUseCases, type UseCaseTheme } from "@/use-cases/registry";

export type PrototypeTheme = UseCaseTheme;

type PrototypeShellProps = {
  locale: Locale;
  children: React.ReactNode;
  theme?: PrototypeTheme;
};

const LOCALE_SWITCHER: Locale[] = ["en", "uk", "pl"];
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
  const activeNavRef = useRef<HTMLAnchorElement>(null);
  const normalizedPath = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const themeClass = THEME_CLASS[theme];
  const navItems = observableUseCases();

  const isActivePath = (href: string) => normalizedPath === href || normalizedPath.startsWith(`${href}/`);
  const activeItem = navItems.find((item) => isActivePath(item.route));

  useEffect(() => {
    activeNavRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [normalizedPath]);

  function changeLocale(next: Locale) {
    if (next === locale) return;
    startTransition(() => router.replace(buildLocalePath(normalizedPath, next)));
  }

  const renderNav = () => navItems.map((item) => {
    const active = isActivePath(item.route);
    return (
      <Link
        ref={active ? activeNavRef : undefined}
        key={item.id}
        href={buildLocalePath(item.route, locale)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex h-9 shrink-0 items-center rounded-lg border border-transparent px-3 text-sm font-medium leading-none transition",
          active ? themeClass : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
        )}
      >
        <span className="whitespace-nowrap">{item.title[locale]}</span>
      </Link>
    );
  });

  return (
    <div className="observatory-shell min-h-screen text-white" data-prototype-theme={theme}>
      <header className="product-header observatory-header">
        <div className="product-header-inner observatory-header-inner">
          <ProductLockup href={buildLocalePath("/", locale)} product="Observatory" />
          <div className="hidden h-6 w-px shrink-0 bg-white/10 lg:block" />
          <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 lg:flex" aria-label="Observatory applications" style={{ scrollbarWidth: "none" }}>
            {renderNav()}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={studioHref()} className="product-switch-link observatory-studio-link">Studio</Link>
            <div className="flex items-center gap-0.5 rounded-lg border border-white/8 bg-white/[0.03] p-1" aria-label="Language">
              {LOCALE_SWITCHER.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pending}
                  onClick={() => changeLocale(option)}
                  aria-current={option === locale ? "page" : undefined}
                  aria-label={`Switch language to ${option}`}
                  className={cn(
                    "min-h-8 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider leading-none transition",
                    option === locale ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-200",
                  )}
                >
                  {LOCALE_SHORT_LABEL[option]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 lg:hidden">
          <div className="mx-auto flex w-full max-w-[1700px] gap-1 overflow-x-auto px-4 py-2 md:px-6" style={{ scrollbarWidth: "none" }}>
            {renderNav()}
          </div>
        </div>
      </header>
      <div className="observatory-stage mx-auto w-full max-w-[1700px] px-0">
        <div className="flex h-10 items-center gap-1 px-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400 leading-none md:px-6 xl:px-10" aria-label="Breadcrumb">
          <Home className="relative -top-px h-3 w-3 shrink-0 text-slate-500" />
          <ChevronRight className="relative -top-px h-3 w-3 shrink-0 text-slate-600" />
          <span className="truncate leading-none">{activeItem?.title[locale] ?? "Observatory"}</span>
        </div>
        <div className="prototype-shell-content" id="main-content" tabIndex={-1}>{children}</div>
      </div>
    </div>
  );
}
