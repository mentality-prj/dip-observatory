import { Suspense } from "react";

import { ProductionSchedulingWorkspace } from "@/production-scheduling/components/production-scheduling-workspace";
import type { Locale } from "@/lib/observatory-i18n";

export default async function ProductionSchedulingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return (
    <Suspense>
      <ProductionSchedulingWorkspace locale={locale} />
    </Suspense>
  );
}
