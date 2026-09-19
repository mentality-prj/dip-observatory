import { ResourceAllocationWorkspace } from "@/features/resource-allocation";
import type { Locale } from "@/lib/observatory-i18n";

export default async function ResourceAllocationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ResourceAllocationWorkspace locale={locale} />;
}
