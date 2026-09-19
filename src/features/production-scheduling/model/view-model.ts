import type { ProductionSchedulingViewModel } from "../hooks";

/**
 * Stable contract consumed by production-scheduling presentation components.
 * Views should depend on this contract (or narrowed slices of it), never on
 * Next navigation APIs or the scheduling engine directly.
 */
export type ProductionSchedulingVM = ProductionSchedulingViewModel;

export type ProductionSchedulingActions = ProductionSchedulingVM["actions"];
export type ProductionSchedulingVisibility = ProductionSchedulingVM["visibility"];
