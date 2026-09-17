"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale } from "@/lib/observatory-i18n";

export type ApplicationFrontendProps = { locale: Locale };

const CustomerOpportunities = dynamic<ApplicationFrontendProps>(() => import("@/components/customer-opportunities/customer-opportunity-lab").then((m) => ({ default: () => <m.CustomerOpportunityLab /> })));
const GasForecast = dynamic<ApplicationFrontendProps>(() => import("@/components/observatory/gas-forecast-workspace").then((m) => ({ default: () => <m.GasForecastWorkspace /> })));
const ProductionDecision = dynamic<ApplicationFrontendProps>(() => import("@/production-decision/components/production-decision-workspace").then((m) => ({ default: m.ProductionDecisionWorkspace })));
const ProductionReplanning = dynamic<ApplicationFrontendProps>(() => import("@/production-replanning/components/production-replanning-workspace").then((m) => ({ default: m.ProductionReplanningWorkspace })));
const ProductionScheduling = dynamic<ApplicationFrontendProps>(() => import("@/production-scheduling/components/production-scheduling-workspace").then((m) => ({ default: m.ProductionSchedulingWorkspace })));
const ResourceAllocation = dynamic<ApplicationFrontendProps>(() => import("@/resource-allocation/components/resource-allocation-workspace").then((m) => ({ default: m.ResourceAllocationWorkspace })));
const SupplierDecision = dynamic<ApplicationFrontendProps>(() => import("@/supplier/components/supplier-workspace").then((m) => ({ default: m.SupplierWorkspace })));

const frontends: Record<string, ComponentType<ApplicationFrontendProps>> = {
  "customer-opportunities": CustomerOpportunities,
  "gas-forecast": GasForecast,
  "production-decision": ProductionDecision,
  "production-replanning": ProductionReplanning,
  "production-scheduling": ProductionScheduling,
  "resource-allocation": ResourceAllocation,
  "supplier-decision": SupplierDecision,
};

export function ApplicationFrontend({ id, locale }: { id: string; locale: Locale }) {
  const Frontend = frontends[id];
  if (!Frontend) return null;
  return <Frontend locale={locale} />;
}

export function hasApplicationFrontend(id: string): boolean {
  return id in frontends;
}
