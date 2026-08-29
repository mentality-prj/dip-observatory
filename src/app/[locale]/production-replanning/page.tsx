import { redirect } from "next/navigation";

import { ProductionReplanningWorkspace } from "@/production-replanning/components/production-replanning-workspace";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

const ACTIVE_LOCALES = new Set(["en", "pl"]);
const FALLBACK_LOCALE: Locale = "en";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function ProductionReplanningPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!ACTIVE_LOCALES.has(locale)) {
    redirect(buildLocalePath("/production-replanning", FALLBACK_LOCALE));
  }

  return <ProductionReplanningWorkspace locale={locale as Locale} />;
}
