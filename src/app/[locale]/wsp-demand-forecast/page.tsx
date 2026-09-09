import { Suspense } from "react";

import { WspDemandForecastWorkspace } from "@/wsp-demand-forecast/components/wsp-demand-forecast-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export function generateStaticParams() {
  return ["en", "pl"].map((locale) => ({ locale }));
}

export default async function WspDemandForecastPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale: Locale = locale === "pl" ? "pl" : "en";

  return (
    <Suspense>
      <WspDemandForecastWorkspace locale={resolvedLocale} />
    </Suspense>
  );
}
