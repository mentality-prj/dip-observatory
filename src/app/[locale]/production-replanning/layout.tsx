import type { ReactNode } from "react";
import { PrototypeShell } from "@/components/observatory/prototype-shell";
import type { Locale } from "@/lib/observatory-i18n";

export default async function ProductionReplanningLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale: Locale = locale === "pl" ? "pl" : "en";
  return <PrototypeShell locale={resolvedLocale} theme="amber">{children}</PrototypeShell>;
}
