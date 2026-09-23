export const PUBLIC_DEMO_NAMES = {
  resourceAllocation: 'Resource Allocation',
  gtmLab: 'GTM Lab',
} as const

export const PUBLIC_PRODUCT_NAMES = [
  'QDIP',
  'Studio',
  'Observatory',
  'Core',
  PUBLIC_DEMO_NAMES.resourceAllocation,
  PUBLIC_DEMO_NAMES.gtmLab,
] as const

export const LOCALIZATION_ALLOWED_TECHNICAL_TOKENS = [
  'JSON',
  'GDPR',
  'TTF',
  'P10',
  'P90',
] as const
