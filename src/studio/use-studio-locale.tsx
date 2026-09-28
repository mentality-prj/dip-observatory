'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { studioSectionFromPath, type StudioLocale } from './studio-locale'

type StudioRouteContextValue = {
  locale: StudioLocale
  route: string
}

const StudioRouteContext = createContext<StudioRouteContextValue>({ locale: 'en', route: '' })

export function StudioLocaleProvider({
  initialLocale,
  initialRoute = '',
  children,
}: {
  initialLocale: StudioLocale
  initialRoute?: string
  children: ReactNode
}) {
  const route = studioSectionFromPath(initialRoute)
  return <StudioRouteContext.Provider value={{ locale: initialLocale, route }}>{children}</StudioRouteContext.Provider>
}

export function useStudioLocale() {
  return useContext(StudioRouteContext).locale
}

export function useStudioRoute() {
  return useContext(StudioRouteContext).route
}
