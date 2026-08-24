import { redirect } from "next/navigation";

import { EidosWorkspace } from "@/eidos/components/eidos-workspace";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

const EIDOS_ACTIVE_LOCALES = new Set(["en", "pl"]);
const EIDOS_FALLBACK_LOCALE: Locale = "en";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function EidosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!EIDOS_ACTIVE_LOCALES.has(locale)) {
    redirect(buildLocalePath("/eidos", EIDOS_FALLBACK_LOCALE));
  }

  return <EidosWorkspace locale={locale as Locale} />;
}
