"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Locale } from "@/lib/observatory-i18n";
import type { UseCaseId } from "@/use-cases/registry";

export type ApplicationFrontendProps = { locale: Locale };

const GasForecast = dynamic<ApplicationFrontendProps>(() => import("@/features/gas-forecast").then((m) => ({ default: m.GasForecastWorkspace })));
const ResourceAllocation = dynamic<ApplicationFrontendProps>(() => import("@/features/resource-allocation").then((m) => ({ default: m.ResourceAllocationWorkspace })));
const GtmLab = dynamic<ApplicationFrontendProps>(() => import("@/features/gtm-lab").then((m) => ({ default: m.GtmLabWorkspace })));

const frontends = {
  "gas-forecast": GasForecast,
  "resource-allocation": ResourceAllocation,
  "gtm-lab": GtmLab,
} satisfies Record<UseCaseId, ComponentType<ApplicationFrontendProps>>;

export function ApplicationFrontend({ id, locale }: { id: UseCaseId; locale: Locale }) { const Frontend = frontends[id]; return <Frontend locale={locale} />; }
export function hasApplicationFrontend(id: string): id is UseCaseId { return id in frontends; }
