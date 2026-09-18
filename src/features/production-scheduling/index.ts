// Public API for the production-scheduling feature.
// External consumers must not import feature internals directly.
export { ProductionSchedulingWorkspace } from "@/production-scheduling/components/production-scheduling-workspace";
export {
  ProductionSchedulingContainer,
  type ProductionSchedulingViewProps,
} from "./containers/production-scheduling-container";
export {
  useProductionSchedulingViewModel,
  type DisruptionSimulationStep,
  type ProductionSchedulingViewModel,
  type SimulationStep,
} from "./hooks";
export {
  buildDisruptionFinancialRows,
  buildDisruptionSchedulePresentation,
  formatEuro,
  formatPercent,
  getAvoidedDisruptionImpact,
  ProductionSchedulingCopyProvider,
  STRATEGY_CLASSES,
  useProductionSchedulingCopy,
  type DisruptionSchedulePresentation,
  type FinancialImpactRow,
  type ProductionSchedulingActions,
  type ProductionSchedulingVisibility,
  type ProductionSchedulingVM,
} from "./model";
