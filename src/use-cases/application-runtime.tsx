"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale } from "@/lib/observatory-i18n";
import type { UseCaseId } from "@/use-cases/registry";

export type ApplicationFrontendProps = { locale: Locale };

const CustomerOpportunities = dynamic<ApplicationFrontendProps>(() => import("@/features/customer-opportunities").then((m) => ({ default: () => <m.CustomerOpportunityLab /> })));
const GasForecast = dynamic<ApplicationFrontendProps>(() => import("@/features/gas-forecast").then((m) => ({ default: () => <m.GasForecastWorkspace /> })));
const ProductionDecision = dynamic<ApplicationFrontendProps>(() => import("@/features/production-decision").then((m) => ({ default: m.ProductionDecisionWorkspace })));
const ProductionReplanning = dynamic<ApplicationFrontendProps>(() => import("@/features/production-replanning").then((m) => ({ default: m.ProductionReplanningWorkspace })));
const ProductionScheduling = dynamic<ApplicationFrontendProps>(() => import("@/features/production-scheduling").then((m) => ({ default: m.ProductionSchedulingWorkspace })));
const ResourceAllocation = dynamic<ApplicationFrontendProps>(() => import("@/features/resource-allocation").then((m) => ({ default: m.ResourceAllocationWorkspace })));
const SupplierDecision = dynamic<ApplicationFrontendProps>(() => import("@/features/supplier").then((m) => ({ default: m.SupplierWorkspace })));

const frontends = {
  "customer-opportunities": CustomerOpportunities,
  "gas-forecast": GasForecast,
  "production-decision": ProductionDecision,
  "production-replanning": ProductionReplanning,
  "production-scheduling": ProductionScheduling,
  "resource-allocation": ResourceAllocation,
  "supplier-decision": SupplierDecision,
} satisfies Record<UseCaseId, ComponentType<ApplicationFrontendProps>>;

export function ApplicationFrontend({ id, locale }: { id: UseCaseId; locale: Locale }) {
  const Frontend = frontends[id];
  return <Frontend locale={locale} />;
}

export function hasApplicationFrontend(id: string): id is UseCaseId {
  return id in frontends;
}
