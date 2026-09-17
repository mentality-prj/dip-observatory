import { notFound } from "next/navigation";

import { ObservatoryHome } from "@/components/observatory/observatory-home";
import { PrototypeShell } from "@/components/observatory/prototype-shell";
import { isSupportedLocale, type Locale } from "@/lib/observatory-i18n";

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return (
    <PrototypeShell locale={locale as Locale}>
      <ObservatoryHome locale={locale as Locale} />
    </PrototypeShell>
  );
}
