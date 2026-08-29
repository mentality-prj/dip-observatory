import { redirect } from "next/navigation";

import { SupplierWorkspace } from "@/supplier/components/supplier-workspace";
import { buildLocalePath, type Locale } from "@/lib/observatory-i18n";

const ACTIVE_LOCALES = new Set(["en", "pl"]);
const FALLBACK_LOCALE: Locale = "en";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function SupplierDecisionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!ACTIVE_LOCALES.has(locale)) {
    redirect(buildLocalePath("/supplier-decision", FALLBACK_LOCALE));
  }

  return <SupplierWorkspace locale={locale as Locale} />;
}
