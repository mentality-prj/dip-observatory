import { redirect } from "next/navigation";

import { ProductionSchedulingWorkspace } from "@/production-scheduling/components/production-scheduling-workspace";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

const ACTIVE_LOCALES = new Set(["en", "pl"]);
const FALLBACK_LOCALE: Locale = "en";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function ProductionSchedulingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!ACTIVE_LOCALES.has(locale)) {
    redirect(buildLocalePath("/production-scheduling", FALLBACK_LOCALE));
  }

  return <ProductionSchedulingWorkspace locale={locale as Locale} />;
}
