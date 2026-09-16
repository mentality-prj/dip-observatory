import type { Locale } from "@/lib/observatory-i18n";
import { ResourceAllocationWorkspace } from "@/resource-allocation/components/resource-allocation-workspace";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function ResourceAllocationPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <ResourceAllocationWorkspace locale={locale} />;
}
