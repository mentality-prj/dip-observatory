import { ProductionReplanningWorkspace } from "@/production-replanning/components/production-replanning-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export default async function ProductionReplanningPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <ProductionReplanningWorkspace locale={locale} />;
}
