import type { ReactNode } from 'react'

export type TechIconName =
  | 'audit'
  | 'comparison'
  | 'replay'
  | 'modeling'
  | 'constraints'
  | 'optimization'
  | 'explainability'
  | 'human-approval'
  | 'simulation'
  | 'allocation'
  | 'workflow'
  | 'evidence'
  | 'policy'

/**
 * QDIP large-format glyphs. Geometry is constructed on a 64x64 optical grid.
 * Repeated elements use identical measurements; badges overlap their host.
 */
const accent = 'var(--qdip-signal, #c65176)'
const surface = 'var(--qdip-surface, #20232a)'

const artwork: Record<TechIconName, ReactNode> = {
  audit: (
    <g>
      <rect x="9" y="7" width="32" height="46" rx="3.5" />
      <path d="M16 15h18M16 22h13M16 29h15M16 36h10" strokeWidth={1.35} opacity={0.78} />
      <circle cx="39" cy="43" r="9" fill={surface} />
      <path d="M45.5 49.5 55 59" stroke={accent} />
      <path d="M35.5 43h7M39 39.5v7" strokeWidth={1.3} opacity={0.7} />
    </g>
  ),
  comparison: (
    <g>
      <rect x="7" y="12" width="22" height="40" rx="3.5" />
      <rect x="35" y="12" width="22" height="40" rx="3.5" />
      <path d="M12 20h12M40 20h12" strokeWidth={1.3} opacity={0.72} />
      <path d="M12 29h10M12 36h12M12 43h7M40 29h10M40 36h12" strokeWidth={2} />
      <path d="M40 43h12" stroke={accent} strokeWidth={2} />
    </g>
  ),
  replay: (
    <g>
      <path d="M51.7 18.2A24 24 0 1 0 52.8 43.8" />
      <path d="M51.7 10.2v8h-8" stroke={accent} />
      <circle cx="32" cy="32" r="13" strokeWidth={1.8} />
      <path d="m28 24 13 8-13 8z" />
    </g>
  ),
  modeling: (
    <g>
      <path d="M32 7 54 19.5v25L32 57 10 44.5v-25z" />
      <path d="M10 19.5 32 32l22-12.5M32 32v25" />
      <path d="m15.5 30 7 4M48.5 30l-7 4" strokeWidth={1.25} opacity={0.64} />
      <circle cx="32" cy="32" r="2.8" fill={accent} stroke="none" />
    </g>
  ),
  constraints: (
    <g>
      <path d="M17 9H9v46h8M47 9h8v46h-8" />
      <path d="M17 19h30M17 32h30M17 45h30" strokeWidth={1.6} />
      <circle cx="25" cy="19" r="3.5" fill={surface} />
      <circle cx="39" cy="32" r="3.5" fill={accent} stroke="none" />
      <circle cx="28" cy="45" r="3.5" fill={surface} />
    </g>
  ),
  optimization: (
    <g>
      <path d="M10 10v44h45" />
      <path d="M17 44 27 35 37 29 48 17" stroke={accent} />
      <path d="M48 17v37M10 17h38" strokeWidth={1.3} strokeDasharray="3 4" opacity={0.56} />
      <circle cx="17" cy="44" r="2.7" fill={surface} />
      <circle cx="27" cy="35" r="2.7" fill={surface} />
      <circle cx="37" cy="29" r="2.7" fill={surface} />
      <circle cx="48" cy="17" r="3" fill={accent} stroke="none" />
    </g>
  ),
  explainability: (
    <g>
      <rect x="7" y="14" width="15" height="13" rx="3" />
      <rect x="7" y="37" width="15" height="13" rx="3" />
      <circle cx="33" cy="32" r="9" />
      <rect x="45" y="25" width="12" height="14" rx="3" />
      <path d="M22 20.5h4l1.2 4M22 43.5h4l1.2-4M42 32h3" />
      <path d="M12 20.5h5M12 43.5h5M49 32h4" strokeWidth={1.35} opacity={0.72} />
      <circle cx="33" cy="32" r="2.7" fill={accent} stroke="none" />
    </g>
  ),
  'human-approval': (
    <g>
      <rect x="9" y="7" width="32" height="46" rx="3.5" />
      <path d="M16 15h18M16 22h18M16 29h13M16 36h13" strokeWidth={1.35} opacity={0.8} />
      <circle cx="39" cy="43" r="10" fill={surface} stroke={accent} />
      <path d="m34 43 3.5 3.5 7-7" stroke={accent} strokeWidth={1.85} />
    </g>
  ),
  simulation: (
    <g>
      <path d="M10 32h16M26 32C35 32 35 18 45 18M26 32C35 32 35 46 45 46" />
      <circle cx="10" cy="32" r="3" fill={surface} />
      <rect x="45" y="11" width="12" height="14" rx="2.5" />
      <rect x="45" y="39" width="12" height="14" rx="2.5" />
      <path d="M49 16h4M49 20h4M49 44h4M49 48h4" strokeWidth={1.25} opacity={0.72} />
      <circle cx="26" cy="32" r="3" fill={accent} stroke="none" />
    </g>
  ),
  allocation: (
    <g>
      <ellipse cx="14" cy="18" rx="8" ry="4" />
      <path d="M6 18v26c0 5 16 5 16 0V18M6 31c0 5 16 5 16 0" />
      <path d="M22 33h9M31 15v36M31 15h12M31 33h12M31 51h12" />
      <rect x="43" y="9" width="14" height="12" rx="2.5" />
      <rect x="43" y="27" width="14" height="12" rx="2.5" />
      <rect x="43" y="45" width="14" height="12" rx="2.5" />
      <path d="M47 15h6M47 33h6M47 51h6" strokeWidth={1.3} opacity={0.76} />
      <circle cx="31" cy="33" r="2.6" fill={accent} stroke="none" />
    </g>
  ),
  workflow: (
    <g>
      <rect x="9" y="7" width="46" height="14" rx="4" />
      <rect x="9" y="25" width="46" height="14" rx="4" />
      <rect x="9" y="43" width="46" height="14" rx="4" />
      <path d="M32 21v4M32 39v4" />
      <path d="M16 14h18M16 32h18M16 50h18" strokeWidth={1.35} opacity={0.74} />
      <circle cx="45" cy="14" r="3" fill={accent} stroke="none" />
      <circle cx="45" cy="32" r="3" fill={surface} stroke={accent} />
      <circle cx="45" cy="50" r="3" fill={surface} />
    </g>
  ),
  evidence: (
    <g>
      <ellipse cx="26" cy="15" rx="16" ry="5" />
      <path d="M10 15v31c0 7 32 7 32 0V15M10 27c0 7 32 7 32 0M10 38c0 7 32 7 32 0" />
      <circle cx="40" cy="44" r="10" fill={surface} stroke={accent} />
      <path d="m35 44 3.5 3.5 7-7" stroke={accent} strokeWidth={1.85} />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 7 51 15v15c0 13-8 21-19 27-11-6-19-14-19-27V15z" />
      <path d="M23 22h18M23 30h18" strokeWidth={1.35} opacity={0.72} />
      <path d="m24 42 6 6 11-13" stroke={accent} strokeWidth={2} />
    </g>
  ),
}

export function MarketingTechIcon({ name, className }: { name: TechIconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {artwork[name]}
    </svg>
  )
}
