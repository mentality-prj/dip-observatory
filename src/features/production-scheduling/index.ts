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
  useTimeoutSequence,
  type ProductionSchedulingViewModel,
  type SchedulingResults,
} from "./hooks";
export {
  buildDisruptionFinancialRows,
  buildDisruptionSchedulePresentation,
  DISRUPTION_SEQUENCE,
  formatEuro,
  formatPercent,
  getAvoidedDisruptionImpact,
  ProductionSchedulingCopyProvider,
  STRATEGY_CLASSES,
  URGENT_ORDER_SEQUENCE,
  useProductionSchedulingCopy,
  type DisruptionSchedulePresentation,
  type DisruptionSimulationStep,
  type FinancialImpactRow,
  type ProductionSchedulingActions,
  type ProductionSchedulingVisibility,
  type ProductionSchedulingVM,
  type SimulationSequenceStep,
  type SimulationStep,
} from "./model";
