import type { ReactNode } from "react";
import { PrototypeShell } from "@/components/observatory/prototype-shell";
import type { Locale } from "@/lib/observatory-i18n";

export default async function EidosLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <PrototypeShell locale={locale === "pl" ? "pl" : "en"} theme="violet">{children}</PrototypeShell>;
}
