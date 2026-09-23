'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { NetworkMap as NetworkMapComponent } from './network-map'

const NetworkMap = dynamic(
  () => import('./network-map').then((module) => module.NetworkMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[540px] animate-pulse rounded-xl border border-white/10 bg-white/[.025]"
        data-testid="map-loading"
      >
        <p className="p-5 text-sm text-slate-500">Loading geographic network…</p>
      </div>
    ),
  }
)

export type LazyNetworkMapProps = ComponentProps<typeof NetworkMapComponent>

export function LazyNetworkMap(props: LazyNetworkMapProps) {
  return <NetworkMap {...props} />
}
