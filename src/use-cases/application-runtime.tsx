'use client'

import type { ComponentType } from 'react'
import { ObservatoryDecisionNarrative } from '@/components/observatory/decision-narrative'
import { GtmLabWorkspace } from '@/features/gtm-lab/components/gtm-lab-workspace'
import { ResourceAllocationWorkspace } from '@/features/resource-allocation/components/resource-allocation-workspace'
import { SupplyNetworkOptimizationWorkspace } from '@/features/supply-network-optimization/workspace'
import type { Locale } from '@/lib/observatory-i18n'
import { ContractorAllocationDemoRouter } from '@/use-cases/contractor-allocation/workspace-router'
import { ReadinessRecoveryWorkspace } from '@/use-cases/readiness-recovery/workspace'
import { findUseCaseById, type UseCaseId } from '@/use-cases/registry'

export type ApplicationFrontendProps = { locale: Locale }

const frontends = {
  'resource-allocation': ResourceAllocationWorkspace,
  'supply-network-optimization': SupplyNetworkOptimizationWorkspace,
  'contractor-allocation': ContractorAllocationDemoRouter,
  'readiness-recovery': ReadinessRecoveryWorkspace,
  'gtm-lab': GtmLabWorkspace,
} satisfies Record<UseCaseId, ComponentType<ApplicationFrontendProps>>

export function ApplicationFrontend({ id, locale }: { id: UseCaseId; locale: Locale }) {
  const Frontend = frontends[id]
  const useCase = findUseCaseById(id)

  return (
    <>
      {useCase ? <ObservatoryDecisionNarrative locale={locale} useCase={useCase} /> : null}
      <Frontend locale={locale} />
    </>
  )
}

export function hasApplicationFrontend(id: string): id is UseCaseId {
  return id in frontends
}
