import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { PrototypeShell, type PrototypeTheme } from "./prototype-shell";
import { isSupportedLocale } from "@/lib/observatory-i18n";

type PrototypeRouteLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
  theme: PrototypeTheme;
};

export async function PrototypeRouteLayout({ children, params, theme }: PrototypeRouteLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <PrototypeShell locale={locale} theme={theme}>{children}</PrototypeShell>;
}
