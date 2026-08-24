"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  buildLocalePath,
  getObservatoryCopy,
  type Locale,
} from "@/lib/observatory-i18n";

const EIDOS_SWITCHER_LOCALES: Locale[] = ["en", "pl"];

type Props = {
  locale: Locale;
};

export function EidosLocaleSwitcher({ locale }: Props) {
  const copy = getObservatoryCopy(locale);
  const router = useRouter();
  const pathname = usePathname();
  const [isLocalePending, startLocaleTransition] = useTransition();

  return (
    <select
      value={EIDOS_SWITCHER_LOCALES.includes(locale) ? locale : ""}
      disabled={isLocalePending}
      onChange={(event) => {
        const next = event.target.value as Locale;
        if (!next || next === locale) return;
        startLocaleTransition(() => {
          router.replace(buildLocalePath(pathname, next));
        });
      }}
      aria-label={copy.localeLabel}
      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 outline-none transition hover:border-white/20 disabled:opacity-60"
    >
      {locale === "uk" ? (
        <option value="" disabled className="bg-slate-900">
          {copy.localeLabel}
        </option>
      ) : null}
      {EIDOS_SWITCHER_LOCALES.map((option) => (
        <option key={option} value={option} className="bg-slate-900">
          {copy.localeOptions[option]}
        </option>
      ))}
    </select>
  );
}
