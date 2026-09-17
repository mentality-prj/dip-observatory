import { SupplierWorkspace } from "@/supplier/components/supplier-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export default async function SupplierDecisionPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <SupplierWorkspace locale={locale} />;
}
