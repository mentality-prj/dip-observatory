import { ProductionDecisionWorkspace } from "@/production-decision/components/production-decision-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function ProductionDecisionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const resolvedLocale: Locale = locale === "pl" ? "pl" : "en";
  return <ProductionDecisionWorkspace locale={resolvedLocale} />;
}
