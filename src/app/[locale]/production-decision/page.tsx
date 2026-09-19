import { ProductionDecisionWorkspace } from "@/features/production-decision";
import type { Locale } from "@/lib/observatory-i18n";

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function ProductionDecisionPage({ params }: PageProps) {
  const { locale } = await params;
  return <ProductionDecisionWorkspace locale={locale} />;
}
