"use client";

import type { ProductionSchedulingViewProps } from "../containers/production-scheduling-container";
import { ProductionSchedulingCopyProvider } from "../model";
import { ProductionSchedulingLegacyView } from "@/production-scheduling/components/production-scheduling-workspace";

/**
 * Presentation boundary for the scheduling feature.
 *
 * During the strangler migration this delegates rendering to the legacy view,
 * while all new orchestration enters through the feature ViewModel. Sections
 * can now be moved out incrementally without changing the route contract.
 */
export function ProductionSchedulingView({
  viewModel,
}: ProductionSchedulingViewProps) {
  return (
    <ProductionSchedulingCopyProvider locale={viewModel.locale}>
      <ProductionSchedulingLegacyView viewModel={viewModel} />
    </ProductionSchedulingCopyProvider>
  );
}
