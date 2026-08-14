import { connection } from "next/server";
import { notFound } from "next/navigation";

import { DecisionCanvas } from "@/components/observatory/decision-canvas";
import { getObservatoryBootstrapPayload } from "@/lib/dip-api";
import { isSupportedLocale, type Locale } from "@/lib/observatory-i18n";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  await connection();
  const initialPayload = await getObservatoryBootstrapPayload();

  return (
    <DecisionCanvas
      initialPayload={initialPayload}
      initialLocale={locale as Locale}
    />
  );
}
