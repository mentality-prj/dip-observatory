// Public API for Observatory application features.
// Routes must depend on this boundary rather than implementation paths.
export { DecisionAuditView } from "@/studio/decision-audit-view";
export { DecisionCanvas } from "@/components/observatory/decision-canvas";
export { ObservatoryHome } from "@/components/observatory/observatory-home";
export { PrototypeRouteLayout } from "@/components/observatory/prototype-route-layout";
export {
  PrototypeShell,
  type PrototypeTheme,
} from "@/components/observatory/prototype-shell";
