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
 * Large-format engineering glyphs. The main 2.2px silhouette is reinforced
 * by structural 1.35px lines and a single semantic highlight. Every detail
 * encodes part of the decision concept; none is a repeated decorative frame.
 */
const accent = 'var(--qdip-signal, #c65176)'

const artwork: Record<TechIconName, ReactNode> = {
  audit: (
    <g>
      <rect x="8" y="8" width="29" height="48" rx="4" />
      <path d="M17 22v22M23 16h8" strokeWidth={1.35} opacity={0.72} />
      <circle cx="17" cy="22" r="2.4" fill={accent} stroke="none" />
      <circle cx="17" cy="33" r="2.4" fill={surface} />
      <circle cx="17" cy="44" r="2.4" fill={surface} />
      <path d="M24 22h7M24 33h7M24 44h6" strokeWidth={1.4} />
      <circle cx="47" cy="44" r="9" />
      <path d="m53.4 50.4 5.6 5.6" stroke={accent} />
      <path d="m43.5 44 2.5 2.5 4.5-5" stroke={accent} strokeWidth={1.6} />
    </g>
  ),
  comparison: (
    <g>
      <rect x="8" y="13" width="19" height="38" rx="3" />
      <rect x="37" y="13" width="19" height="38" rx="3" />
      <path d="M32 13v38" strokeWidth={1.35} opacity={0.55} />
      <path d="M13 20h9M42 20h9" strokeWidth={1.35} />
      <path d="M13 44h9M42 44h9" strokeWidth={1.35} opacity={0.65} />
      <path d="M13 40v-9l5 4 4-9v14M42 40v-8l5 4 4-13v17" />
      <circle cx="18" cy="35" r="2.5" fill={accent} stroke="none" />
      <circle cx="47" cy="35" r="2.5" fill={accent} stroke="none" />
    </g>
  ),
  replay: (
    <g>
      <path d="M51 20A23 23 0 1 0 54 42" />
      <path d="M51 10v10H41" stroke={accent} />
      <circle cx="32" cy="32" r="14" strokeWidth={1.6} opacity={0.78} />
      <path d="m28 25 12 7-12 7z" />
      <path d="M32 18v3M46 32h-3M32 46v-3M18 32h3" strokeWidth={1.4} opacity={0.65} />
    </g>
  ),
  modeling: (
    <g>
      <path d="m32 7 22 12v26L32 57 10 45V19z" />
      <path d="m10 19 22 13 22-13M32 32v25" />
      <path d="M22 39 32 32l10 7M22 39v9M42 39v9" strokeWidth={1.35} opacity={0.75} />
      <circle cx="22" cy="39" r="2.5" fill={surface} />
      <circle cx="42" cy="39" r="2.5" fill={surface} />
      <circle cx="32" cy="32" r="2.5" fill={accent} stroke="none" />
      <path d="M17 23v6M47 23v6" strokeWidth={1.35} opacity={0.6} />
    </g>
  ),
  constraints: (
    <g>
      <path d="M17 10H9v44h8M47 10h8v44h-8" />
      <path d="M19 20h26M19 32h26M19 44h26" strokeWidth={1.6} />
      <circle cx="24" cy="20" r="3.5" fill={surface} />
      <circle cx="37" cy="32" r="3.5" fill={surface} stroke={accent} />
      <circle cx="28" cy="44" r="3.5" fill={surface} />
      <path d="M19 14h26M19 50h26" strokeWidth={1.35} opacity={0.5} />
    </g>
  ),
  optimization: (
    <g>
      <path d="M10 9v45h45" />
      <path d="M15 46 25 37 36 29 48 17" stroke={accent} />
      <path d="M48 17v37M10 17h38" strokeWidth={1.25} strokeDasharray="3 4" opacity={0.58} />
      <circle cx="15" cy="46" r="2.6" fill={surface} />
      <circle cx="25" cy="37" r="2.6" fill={surface} />
      <circle cx="36" cy="29" r="2.6" fill={surface} />
      <circle cx="48" cy="17" r="2.6" fill={accent} stroke="none" />
      <circle cx="48" cy="17" r="6" stroke={accent} strokeWidth={1.35} />
      <path d="M18 54v-3M29 54v-3M40 54v-3" strokeWidth={1.3} opacity={0.6} />
    </g>
  ),
  explainability: (
    <g>
      <rect x="6" y="13" width="16" height="14" rx="3" />
      <rect x="6" y="38" width="16" height="14" rx="3" />
      <circle cx="33" cy="32" r="8" />
      <rect x="45" y="25" width="13" height="14" rx="3" />
      <path d="M22 20h4l4 5M22 45h4l4-6M41 32h4" />
      <path d="M11 20h6M11 45h6M49 30h5M49 34h5" strokeWidth={1.35} opacity={0.72} />
      <circle cx="33" cy="32" r="2.6" fill={accent} stroke="none" />
    </g>
  ),
  'human-approval': (
    <g>
      <rect x="8" y="7" width="29" height="49" rx="4" />
      <path d="M15 17h15M15 25h15M15 33h10M15 41h15" strokeWidth={1.4} />
      <path d="M15 48h10" strokeWidth={1.4} opacity={0.64} />
      <circle cx="47" cy="44" r="10" fill={surface} stroke={accent} />
      <path d="m42 44 3.5 3.5 6.5-7" stroke={accent} strokeWidth={1.8} />
    </g>
  ),
  simulation: (
    <g>
      <path d="M13 32h13M26 32C34 32 34 16 43 16M26 32C34 32 34 48 43 48" />
      <circle cx="10" cy="32" r="3" fill={surface} />
      <circle cx="26" cy="32" r="3" fill={accent} stroke="none" />
      <rect x="45" y="10" width="12" height="13" rx="2" />
      <rect x="45" y="41" width="12" height="13" rx="2" stroke={accent} />
      <path d="M49 15h4M49 19h4M49 46h4M49 50h4" strokeWidth={1.35} opacity={0.72} />
    </g>
  ),
  allocation: (
    <g>
      <ellipse cx="14" cy="18" rx="8" ry="4" />
      <path d="M6 18v26c0 5 16 5 16 0V18M6 31c0 5 16 5 16 0" />
      <path d="M22 33h9M31 15v36M31 15h10M31 33h10M31 51h10" />
      <rect x="43" y="8" width="13" height="14" rx="3" />
      <rect x="43" y="26" width="13" height="14" rx="3" />
      <rect x="43" y="44" width="13" height="14" rx="3" />
      <path d="M47 15h5M47 33h5M47 51h5" strokeWidth={1.4} opacity={0.74} />
      <circle cx="31" cy="33" r="2.5" fill={accent} stroke="none" />
    </g>
  ),
  workflow: (
    <g>
      <rect x="9" y="7" width="46" height="14" rx="4" />
      <rect x="9" y="25" width="46" height="14" rx="4" />
      <rect x="9" y="43" width="46" height="14" rx="4" />
      <path d="M32 21v4M32 39v4" />
      <path d="M16 14h18M16 32h18M16 50h18" strokeWidth={1.35} opacity={0.72} />
      <circle cx="45" cy="14" r="3.5" fill={accent} stroke="none" />
      <circle cx="45" cy="32" r="3.5" fill={surface} stroke={accent} />
      <circle cx="45" cy="50" r="3.5" fill={surface} />
    </g>
  ),
  evidence: (
    <g>
      <ellipse cx="22" cy="15" rx="14" ry="5" />
      <path d="M8 15v30c0 7 28 7 28 0V15M8 26c0 7 28 7 28 0M8 36c0 7 28 7 28 0" />
      <path d="M14 30h6M14 40h6" strokeWidth={1.3} opacity={0.68} />
      <circle cx="48" cy="44" r="9" fill={surface} stroke={accent} />
      <path d="m44 44 3 3 5-6" stroke={accent} strokeWidth={1.8} />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 6 51 14v16c0 13-8 21-19 27-11-6-19-14-19-27V14z" />
      <path d="M23 21h18M23 29h18" strokeWidth={1.35} opacity={0.7} />
      <path d="m24 41 6 6 11-13" stroke={accent} strokeWidth={2} />
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
