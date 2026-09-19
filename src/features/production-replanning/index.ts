// Public API for the production-replanning feature.
// External consumers should prefer this boundary over legacy deep imports.
export { ProductionReplanningWorkspace } from "@/production-replanning/components/production-replanning-workspace";
export {
  BASELINE_WHAT_IF,
  buildScenario,
  type WhatIfState,
} from "./model";
