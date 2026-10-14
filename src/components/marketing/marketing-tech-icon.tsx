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
 * QDIP decision glyphs v2: a unified 64px optical grid, 2.5px stroke,
 * no tiny strokes, overlapping mask tricks or repeated browser chrome.
 * The single semantic accent is inherited from the marketing palette.
 */
const accent = 'var(--qdip-signal, #c65176)'

const artwork: Record<TechIconName, ReactNode> = {
  audit: (
    <g>
      <rect x="10" y="8" width="31" height="45" rx="5" />
      <path d="M17 19h17M17 27h13M17 35h7" />
      <circle cx="42" cy="42" r="11" />
      <path d="m50 50 7 7" stroke={accent} />
    </g>
  ),
  comparison: (
    <g>
      <rect x="8" y="13" width="20" height="38" rx="4" />
      <rect x="36" y="13" width="20" height="38" rx="4" />
      <path d="M14 22h8M42 22h8" />
      <path d="M14 43v-9h8v9M42 43V29h8v14" stroke={accent} />
    </g>
  ),
  replay: (
    <g>
      <path d="M49 14a23 23 0 1 0 5 25" />
      <path d="M49 24V14H39" stroke={accent} />
      <path d="m27 23 15 9-15 9z" />
    </g>
  ),
  modeling: (
    <g>
      <path d="m32 8 22 12v24L32 56 10 44V20z" />
      <path d="m10 20 22 13 22-13M32 33v23" />
      <circle cx="32" cy="33" r="3.1" fill={accent} stroke="none" />
    </g>
  ),
  constraints: (
    <g>
      <path d="M11 16h12M33 16h20M11 32h27M48 32h5M11 48h9M30 48h23" />
      <circle cx="28" cy="16" r="5" />
      <circle cx="43" cy="32" r="5" stroke={accent} />
      <circle cx="25" cy="48" r="5" />
    </g>
  ),
  optimization: (
    <g>
      <path d="M10 53h44" />
      <path d="m13 44 11-11 9 5 17-21" stroke={accent} />
      <path d="M40 17h10v10" stroke={accent} />
      <circle cx="13" cy="44" r="3" />
      <circle cx="24" cy="33" r="3" />
      <circle cx="33" cy="38" r="3" />
    </g>
  ),
  explainability: (
    <g>
      <circle cx="32" cy="34" r="14" />
      <circle cx="13" cy="13" r="4" />
      <circle cx="51" cy="13" r="4" />
      <path d="m17 16 7 8M47 16l-7 8" />
      <path d="M27 32c0-6 10-6 10 0 0 3-5 4-5 7M32 45v1" stroke={accent} />
    </g>
  ),
  'human-approval': (
    <g>
      <circle cx="25" cy="20" r="8" />
      <path d="M10 49c0-11 6-18 15-18 6 0 11 3 14 8" />
      <circle cx="44" cy="44" r="11" stroke={accent} />
      <path d="m39 44 4 4 7-9" stroke={accent} />
    </g>
  ),
  simulation: (
    <g>
      <circle cx="12" cy="32" r="5" />
      <path d="M17 32h10c5 0 7-12 13-12h7" />
      <path d="M17 32h10c5 0 7 12 13 12h7" stroke={accent} />
      <circle cx="51" cy="20" r="5" />
      <circle cx="51" cy="44" r="5" stroke={accent} />
    </g>
  ),
  allocation: (
    <g>
      <rect x="10" y="25" width="16" height="16" rx="3" />
      <path d="M26 33h10M36 16v34M36 16h4M36 33h4M36 50h4" />
      <rect x="40" y="10" width="14" height="12" rx="3" />
      <rect x="40" y="27" width="14" height="12" rx="3" stroke={accent} />
      <rect x="40" y="44" width="14" height="12" rx="3" />
      <circle cx="36" cy="33" r="3" fill={accent} stroke="none" />
    </g>
  ),
  workflow: (
    <g>
      <rect x="10" y="8" width="44" height="13" rx="4" />
      <rect x="10" y="26" width="44" height="13" rx="4" />
      <rect x="10" y="44" width="44" height="13" rx="4" />
      <path d="M32 21v5M32 39v5M17 14.5h17M17 32.5h17M17 50.5h17" />
      <circle cx="46" cy="14.5" r="2.4" fill={accent} stroke="none" />
      <circle cx="46" cy="32.5" r="2.4" fill={accent} stroke="none" />
      <circle cx="46" cy="50.5" r="2.4" fill={accent} stroke="none" />
    </g>
  ),
  evidence: (
    <g>
      <path d="M16 8h24l9 9v39H16z" />
      <path d="M40 8v10h9M23 28h18M23 36h12" />
      <path d="m24 46 5 5 10-10" stroke={accent} />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 7 51 15v16c0 13-8 21-19 26-11-5-19-13-19-26V15z" />
      <path d="m23 32 7 7 13-15" stroke={accent} />
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
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {artwork[name]}
    </svg>
  )
}
