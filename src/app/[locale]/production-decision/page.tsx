import type { Locale } from "@/lib/observatory-i18n";
import { ProductionDecisionWorkspace } from "@/production-decision/components/production-decision-workspace";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProductionDecisionPage({ params }: PageProps) {
  const { locale } = await params;
  return <ProductionDecisionWorkspace locale={locale} />;
}
