import type { Locale } from "@/lib/observatory-i18n";
import { ProductionDecisionWorkspace } from "@/production-decision/components/production-decision-workspace";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProductionDecisionPage({ params }: PageProps) {
  const { locale } = await params;
  const resolvedLocale: Locale = locale === "pl" ? "pl" : "en";

  return <ProductionDecisionWorkspace locale={resolvedLocale} />;
}
