'use client'

import type { ComponentType } from 'react'
import { ObservatoryDecisionNarrative } from '@/components/observatory/decision-narrative'
import { GtmLabWorkspace } from '@/features/gtm-lab/components/gtm-lab-workspace'
import { ResourceAllocationWorkspace } from '@/features/resource-allocation/components/resource-allocation-workspace'
import { SupplyNetworkResilienceWorkspace } from '@/features/supply-network-resilience/workspace'
import type { Locale } from '@/lib/observatory-i18n'
import { findUseCaseById, type UseCaseId } from '@/use-cases/registry'

export type ApplicationFrontendProps = { locale: Locale }

const frontends = {
  'resource-allocation': ResourceAllocationWorkspace,
  'supply-network-resilience': SupplyNetworkResilienceWorkspace,
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
