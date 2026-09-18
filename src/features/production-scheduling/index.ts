// Public API for the production-scheduling feature.
// External consumers must not import feature internals directly.
export { ProductionSchedulingWorkspace } from "@/production-scheduling/components/production-scheduling-workspace";
export {
  DisruptionFinancialPanel,
  DisruptionResults,
  DisruptionScenarioView,
  DisruptionScheduleDiff,
  type DisruptionResultsProps,
  type DisruptionScenarioViewProps,
} from "./components";
export {
  ProductionSchedulingContainer,
  type ProductionSchedulingViewProps,
} from "./containers/production-scheduling-container";
export {
  useProductionSchedulingViewModel,
  useSchedulingResults,
  type DisruptionSimulationStep,
  type ProductionSchedulingViewModel,
  type SchedulingResults,
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
