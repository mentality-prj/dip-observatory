"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale } from "@/lib/observatory-i18n";

export type ApplicationFrontendProps = { locale: Locale };

const CustomerOpportunities = dynamic(() => import("@/components/customer-opportunities/customer-opportunity-lab").then((m) => ({ default: () => <m.CustomerOpportunityLab /> })));
const GasForecast = dynamic(() => import("@/components/observatory/gas-forecast-workspace").then((m) => ({ default: () => <m.GasForecastWorkspace /> })));
const ProductionDecision = dynamic(() => import("@/production-decision/components/production-decision-workspace").then((m) => ({ default: m.ProductionDecisionWorkspace })));
const ProductionReplanning = dynamic(() => import("@/production-replanning/components/production-replanning-workspace").then((m) => ({ default: m.ProductionReplanningWorkspace })));
const ProductionScheduling = dynamic(() => import("@/production-scheduling/components/production-scheduling-workspace").then((m) => ({ default: m.ProductionSchedulingWorkspace })));
const ResourceAllocation = dynamic(() => import("@/resource-allocation/components/resource-allocation-workspace").then((m) => ({ default: m.ResourceAllocationWorkspace })));
const SupplierDecision = dynamic(() => import("@/supplier/components/supplier-workspace").then((m) => ({ default: m.SupplierWorkspace })));
const WspDemandForecast = dynamic(() => import("@/wsp-demand-forecast/components/wsp-demand-forecast-workspace").then((m) => ({ default: m.WspDemandForecastWorkspace })));
const ViveProductionIntelligence = dynamic(() => import("@/vive-production-intelligence/components/vive-production-intelligence-workspace").then((m) => ({ default: m.ViveProductionIntelligenceWorkspace })));

const frontends: Record<string, ComponentType<ApplicationFrontendProps>> = {
  "customer-opportunities": CustomerOpportunities,
  "gas-forecast": GasForecast,
  "production-decision": ProductionDecision,
  "production-replanning": ProductionReplanning,
  "production-scheduling": ProductionScheduling,
  "resource-allocation": ResourceAllocation,
  "supplier-decision": SupplierDecision,
  "wsp-demand-forecast": WspDemandForecast,
  "vive-production-intelligence": ViveProductionIntelligence,
};

export function ApplicationFrontend({ id, locale }: { id: string; locale: Locale }) {
  const Frontend = frontends[id];
  if (!Frontend) return null;
  return <Frontend locale={locale} />;
}

export function hasApplicationFrontend(id: string): boolean {
  return id in frontends;
}
