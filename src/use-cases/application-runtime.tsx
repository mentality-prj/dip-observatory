'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { Locale } from '@/lib/observatory-i18n'
import { ObservatoryDecisionNarrative } from '@/components/observatory/decision-narrative'
import { findUseCaseById, type UseCaseId } from '@/use-cases/registry'

export type ApplicationFrontendProps = { locale: Locale }
const ResourceAllocation = dynamic<ApplicationFrontendProps>(() => import('@/features/resource-allocation/components/resource-allocation-workspace').then((m) => ({ default: m.ResourceAllocationWorkspace })))
const SupplyNetworkResilience = dynamic<ApplicationFrontendProps>(() => import('@/features/supply-network-resilience/workspace').then((m) => ({ default: m.SupplyNetworkResilienceWorkspace })))
const GtmLab = dynamic<ApplicationFrontendProps>(() => import('@/features/gtm-lab/components/gtm-lab-workspace').then((m) => ({ default: m.GtmLabWorkspace })))

const frontends = {
  'resource-allocation': ResourceAllocation,
  'supply-network-resilience': SupplyNetworkResilience,
  'gtm-lab': GtmLab,
} satisfies Record<UseCaseId, ComponentType<ApplicationFrontendProps>>

export function ApplicationFrontend({ id, locale }: { id: UseCaseId; locale: Locale }) {
  const Frontend = frontends[id]
  const useCase = findUseCaseById(id)
  return <>{useCase ? <ObservatoryDecisionNarrative locale={locale} useCase={useCase} /> : null}<Frontend locale={locale} /></>
}
export function hasApplicationFrontend(id: string): id is UseCaseId { return id in frontends }
