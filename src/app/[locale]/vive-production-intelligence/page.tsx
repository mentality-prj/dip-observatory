import type { Locale } from "@/lib/observatory-i18n";
import { ViveProductionIntelligenceWorkspace } from "@/vive-production-intelligence/components/vive-production-intelligence-workspace";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function ViveProductionIntelligencePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <ViveProductionIntelligenceWorkspace locale={locale} />;
}
