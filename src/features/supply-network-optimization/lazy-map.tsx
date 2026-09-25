'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { NetworkMap as NetworkMapComponent } from './network-map'

const NetworkMap = dynamic(() => import('./network-map').then((module) => module.NetworkMap), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[540px] animate-pulse rounded-xl border border-white/10 bg-white/[.025]"
      data-testid="map-loading"
    ></div>
  ),
})

export type LazyNetworkMapProps = ComponentProps<typeof NetworkMapComponent>

export function LazyNetworkMap(props: LazyNetworkMapProps) {
  return <NetworkMap {...props} />
}
