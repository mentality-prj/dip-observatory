// Public API for Studio application features.
// Route composition must depend on this boundary rather than legacy implementation paths.
export { DecisionStudio } from '@/studio/decision-studio'
export { ProfileDetail } from '@/studio/profile-detail'
export { StudioNav } from '@/studio/studio-nav'
export { StudioFooter } from '@/studio/studio-footer'
export { StudioMobileNavigation } from '@/studio/studio-mobile-navigation'
export { StudioCoreStatus, StudioProductHeader } from '@/studio/studio-product-header'
export { StudioLocaleProvider, useStudioLocale } from '@/studio/use-studio-locale'
export { parseStudioLocale } from '@/studio/studio-locale'
export { studioCopy } from '@/studio/studio-copy'
export { profileSections, type ProfileSection } from '@/studio/presentation'
export type { Audit, DimensionResult } from '@/studio/contracts'
