import { Suspense } from "react";

import { WspDemandForecastWorkspace } from "@/wsp-demand-forecast/components/wsp-demand-forecast-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export default async function WspDemandForecastPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <Suspense>
      <WspDemandForecastWorkspace locale={locale} />
    </Suspense>
  );
}
