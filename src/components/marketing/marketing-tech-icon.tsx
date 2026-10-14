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
      <rect x="8" y="7" width="35" height="49" rx="4" />
      <path d="M17 15h17M17 22v25" />
      <circle cx="17" cy="23" r="2.5" fill={accent} stroke="none" />
      <circle cx="17" cy="35" r="2.3" />
      <circle cx="17" cy="47" r="2.3" />
      <g strokeWidth={1.35} opacity={0.7}>
        <path d="M24 23h12M24 35h9M24 47h5M23 18h11" />
        <path d="m29 31 3 4 4-6" stroke={accent} opacity={1} />
      </g>
      <circle cx="45" cy="43" r="10" />
      <path d="m52 50 7 7" stroke={accent} />
      <path d="m41 43 3 3 5-6" strokeWidth={1.6} />
    </g>
  ),
  comparison: (
    <g>
      <path d="M31.5 9v46" strokeWidth={1.35} opacity={0.55} />
      <rect x="7" y="13" width="21" height="37" rx="3" />
      <rect x="36" y="13" width="21" height="37" rx="3" />
      <path d="M12 20h11M41 20h11" strokeWidth={1.35} opacity={0.65} />
      <path d="M12 43V29l5 5 5-9v18M41 43V32l5 5 6-13v19" />
      <path d="M11 44h13M40 44h13" strokeWidth={1.25} opacity={0.55} />
      <path d="m29 29 2.5 3 2.5-3m-5 6 2.5-3 2.5 3" stroke={accent} strokeWidth={1.5} />
      <circle cx="17" cy="34" r="2" fill={accent} stroke="none" />
      <circle cx="46" cy="37" r="2" fill={accent} stroke="none" />
    </g>
  ),
  replay: (
    <g>
      <path d="M48 15a23 23 0 1 0 8 18" />
      <path d="M48 7v10H38" stroke={accent} />
      <circle cx="32" cy="32" r="16" opacity={0.75} />
      <path d="M32 20v3M44 32h-3M32 44v-3M20 32h3" strokeWidth={1.35} opacity={0.7} />
      <path d="m28 25 12 7-12 7z" />
      <path d="m16 14 4 2M13 48l5-3" strokeWidth={1.3} opacity={0.65} />
      <circle cx="32" cy="32" r="2" fill={accent} stroke="none" />
    </g>
  ),
  modeling: (
    <g>
      <path d="m32 6 23 13v27L32 59 9 46V19z" />
      <path d="m9 19 23 13 23-13M32 32v27" />
      <path d="M20 13v11M44 13v11M20 24l12 7 12-7" strokeWidth={1.25} opacity={0.62} />
      <path d="m19 38 8 4v9M45 38l-8 4v9" strokeWidth={1.35} opacity={0.7} />
      <circle cx="32" cy="32" r="3" fill={accent} stroke="none" />
      <circle cx="19" cy="38" r="2.4" />
      <circle cx="45" cy="38" r="2.4" />
      <path d="m19 38 13-6 13 6" stroke={accent} strokeWidth={1.45} />
      <circle cx="32" cy="50" r="2" fill={accent} stroke="none" />
    </g>
  ),
  constraints: (
    <g>
      <path d="M17 8H9v48h8M47 8h8v48h-8" />
      <path d="M19 21h24M19 34h24M19 47h24" strokeWidth={1.35} opacity={0.75} />
      <path d="M18 17v8M44 30v8M30 43v8" opacity={0.75} />
      <circle cx="25" cy="21" r="4" fill="#20232a" />
      <circle cx="38" cy="34" r="4" stroke={accent} fill="#20232a" />
      <circle cx="27" cy="47" r="4" fill="#20232a" />
      <path d="m42 13 5 5-5 5" stroke={accent} strokeWidth={1.4} />
      <path d="M20 10h25" strokeWidth={1.3} opacity={0.65} />
    </g>
  ),
  optimization: (
    <g>
      <path d="M9 10v45h46" />
      <path d="M14 46C22 45 27 36 31 29S43 13 53 12" stroke={accent} />
      <path d="M15 51h1M25 51h1M36 51h1M47 51h1" strokeWidth={1.4} opacity={0.65} />
      <path d="M17 42h8m9-17h9" strokeWidth={1.3} opacity={0.58} />
      <circle cx="20" cy="44" r="2.5" />
      <circle cx="29" cy="34" r="2.5" />
      <circle cx="39" cy="21" r="4" stroke={accent} />
      <circle cx="49" cy="14" r="2.5" />
      <path d="M39 25v27M12 21h27" strokeWidth={1.25} strokeDasharray="3 4" opacity={0.65} />
      <path d="m47 33 3 3 6-7" stroke={accent} strokeWidth={1.7} />
    </g>
  ),
  explainability: (
    <g>
      <rect x="6" y="17" width="16" height="13" rx="3" />
      <rect x="6" y="41" width="16" height="13" rx="3" />
      <rect x="42" y="28" width="16" height="16" rx="3" />
      <circle cx="33" cy="16" r="6" />
      <path d="M22 23h11V22M22 47h11V38h9M33 22v16" />
      <path d="m27 31 6 7 9-3" stroke={accent} strokeWidth={1.7} />
      <path d="M11 23h6M11 47h6M47 35h6" strokeWidth={1.3} opacity={0.7} />
      <circle cx="33" cy="38" r="3.4" fill={accent} stroke="none" />
      <path d="m45 20 3 3 5-7" stroke={accent} />
    </g>
  ),
  'human-approval': (
    <g>
      <path d="M12 7h28l9 9v39H12z" />
      <path d="M40 7v10h9M19 25h22M19 32h15" strokeWidth={1.35} opacity={0.75} />
      <path d="m19 43 6-7 4 5 6-8" stroke={accent} />
      <path d="M19 48h15" strokeWidth={1.4} opacity={0.7} />
      <circle cx="46" cy="46" r="10" fill="#20232a" stroke={accent} />
      <path d="m41 46 4 4 7-9" stroke={accent} strokeWidth={1.9} />
      <path d="M19 14h13" strokeWidth={1.35} opacity={0.6} />
    </g>
  ),
  simulation: (
    <g>
      <path d="M10 32h15M25 32c6 0 6-16 15-16h10M25 32c6 0 6 16 15 16h10" />
      <circle cx="10" cy="32" r="4" />
      <circle cx="26" cy="32" r="3.2" fill={accent} stroke="none" />
      <rect x="44" y="9" width="12" height="13" rx="2" />
      <rect x="44" y="42" width="12" height="13" rx="2" stroke={accent} />
      <g strokeWidth={1.35} opacity={0.76}>
        <path d="M48 14h4M48 18h2M48 47h4M48 51h2" />
        <path d="M12 44h12M12 48h8M12 16h12M12 20h8" strokeDasharray="2 3" />
      </g>
      <path d="m34 11 3-3 3 3" stroke={accent} strokeWidth={1.4} />
    </g>
  ),
  allocation: (
    <g>
      <ellipse cx="13" cy="19" rx="8" ry="4" />
      <path d="M5 19v24c0 6 16 6 16 0V19M5 30c0 6 16 6 16 0" />
      <path d="M21 32h9M30 16v34M30 16h11M30 33h11M30 50h11" />
      <path d="m37 13 4 3-4 3M37 30l4 3-4 3M37 47l4 3-4 3" stroke={accent} strokeWidth={1.4} />
      <rect x="42" y="9" width="15" height="14" rx="3" />
      <rect x="42" y="26" width="15" height="14" rx="3" />
      <rect x="42" y="43" width="15" height="14" rx="3" />
      <path d="M46 18h6M46 35h7M46 52h4" strokeWidth={1.4} opacity={0.72} />
      <circle cx="30" cy="33" r="2.5" fill={accent} stroke="none" />
    </g>
  ),
  workflow: (
    <g>
      <rect x="9" y="7" width="46" height="14" rx="4" />
      <rect x="9" y="25" width="46" height="14" rx="4" />
      <rect x="9" y="43" width="46" height="14" rx="4" />
      <path d="M32 21v4M32 39v4" />
      <path d="M16 14h19M16 32h19M16 50h19" strokeWidth={1.35} opacity={0.74} />
      <path d="m42 14 3 3 5-6" stroke={accent} strokeWidth={1.7} />
      <circle cx="46" cy="32" r="3" stroke={accent} />
      <path d="m43 50 3 3 5-6" stroke={accent} strokeWidth={1.7} />
    </g>
  ),
  evidence: (
    <g>
      <ellipse cx="27" cy="15" rx="17" ry="6" />
      <path d="M10 15v30c0 8 34 8 34 0V15M10 26c0 8 34 8 34 0M10 36c0 8 34 8 34 0" />
      <path d="M16 32h5M16 42h5" strokeWidth={1.3} opacity={0.62} />
      <circle cx="46" cy="44" r="11" fill="#20232a" />
      <path d="M40 44h12M46 38v12" strokeWidth={1.25} opacity={0.65} />
      <path d="m41 45 4 4 7-9" stroke={accent} strokeWidth={1.8} />
      <path d="m17 15 8 3 10-3" strokeWidth={1.3} opacity={0.65} />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 6 52 14v16c0 14-8 22-20 28-12-6-20-14-20-28V14z" />
      <path d="M21 21h21M21 28h15M21 35h20" strokeWidth={1.3} opacity={0.62} />
      <path d="m23 43 6 5 12-14" stroke={accent} strokeWidth={2} />
      <circle cx="43" cy="22" r="3" fill={accent} stroke="none" />
      <path d="M17 17h6M41 41h7" strokeWidth={1.3} opacity={0.6} />
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
