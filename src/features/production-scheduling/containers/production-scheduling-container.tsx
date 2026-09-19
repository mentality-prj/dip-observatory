"use client";

import type { Locale } from "@/lib/observatory-i18n";
import { useProductionSchedulingViewModel } from "../hooks";

export interface ProductionSchedulingViewProps {
  viewModel: ReturnType<typeof useProductionSchedulingViewModel>;
}

/**
 * Feature composition boundary. The container owns orchestration; the injected
 * view owns rendering only. Keeping the view injectable lets us migrate the
 * legacy workspace section-by-section without duplicating business logic.
 */
export function ProductionSchedulingContainer({
  locale,
  View,
}: {
  locale: Locale;
  View: React.ComponentType<ProductionSchedulingViewProps>;
}) {
  const viewModel = useProductionSchedulingViewModel(locale);
  return <View viewModel={viewModel} />;
}
