import { notFound } from "next/navigation";

import { CustomerOpportunityLab } from "@/components/customer-opportunities/customer-opportunity-lab";
import { isSupportedLocale } from "@/lib/observatory-i18n";

export default async function CustomerOpportunitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <CustomerOpportunityLab />;
}
