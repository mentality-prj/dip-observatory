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

const artwork: Record<TechIconName, ReactNode> = {
  audit: (
    <g>
      <defs>
        <clipPath id="qdip-audit-loupe-cutout" clipPathUnits="userSpaceOnUse">
          <path
            d="M0 0H64V64H0Z M32.8 42A11.2 11.2 0 1 0 55.2 42A11.2 11.2 0 1 0 32.8 42Z"
            clipRule="evenodd"
            stroke="none"
          />
        </clipPath>
      </defs>
      <g clipPath="url(#qdip-audit-loupe-cutout)">
        <rect x="8" y="11" width="37" height="43" rx="3" />
        <path d="M19 11V7h9v4M18 7h11" />
        <rect x="13" y="19" width="8" height="8" rx="1" />
        <rect x="13" y="30" width="8" height="8" rx="1" />
        <rect x="13" y="41" width="8" height="8" rx="1" />
        <path d="m14.6 23 2 2 3.5-4M14.6 34l2 2 3.5-4M14.6 45l2 2 3.5-4" strokeWidth={1.3} />
        <path d="M26 23h12M26 34h12M26 45h12" />
      </g>
      <circle cx="44" cy="42" r="10.5" />
      <path d="m51.6 49.6 9 9" />
    </g>
  ),
  comparison: (
    <g>
      <path d="M13 20 29 11M35 11 51 20" />
      <path d="M13 20h17M34 20h17M32 13v5M32 22v29M24 54h16M20 58h24" />
      <circle cx="32" cy="10" r="3" />
      <circle cx="32" cy="20" r="2" />
      <g>
        <path d="M13 20 6 38M13 20l7 18" />
        <path d="M6 38h14M6 38q7 12 14 0" />
        <circle cx="13" cy="20" r="2" />
      </g>
      <g transform="translate(64 0) scale(-1 1)">
        <path d="M13 20 6 38M13 20l7 18" />
        <path d="M6 38h14M6 38q7 12 14 0" />
        <circle cx="13" cy="20" r="2" />
      </g>
    </g>
  ),
  replay: (
    <g>
      <path d="M11 25a22 22 0 0 1 38-10M49 8v7h-7" />
      <path d="M53 39a22 22 0 0 1-38 10M15 56v-7h7" />
      <circle cx="32" cy="32" r="15" />
      <path d="m27 23 14 9-14 9z" />
    </g>
  ),
  modeling: (
    <g>
      <path d="M32 7 53 19v26L32 57 11 45V19z" />
      <path d="M11 19 32 31 53 19M32 31v26" />
      <path d="M21 13 42 25M43 13 22 25" strokeWidth={1.4} />
      <circle cx="20" cy="36" r="5.5" />
      <circle cx="44" cy="36" r="5.5" />
      <circle cx="20" cy="36" r="2" />
      <circle cx="44" cy="36" r="2" />
      <path d="M20 28v2M20 42v2M12 36h2M26 36h2M44 28v2M44 42v2M36 36h2M50 36h2" strokeWidth={1.4} />
    </g>
  ),
  constraints: (
    <g>
      <rect x="7" y="9" width="50" height="46" rx="4" />
      <path d="M14 20h10M30 20h19M14 32h22M42 32h7M14 44h5M25 44h24" />
      <circle cx="27" cy="20" r="3" />
      <circle cx="39" cy="32" r="3" />
      <circle cx="22" cy="44" r="3" />
      <path d="M15 14h10M39 50h11" strokeWidth={1.4} />
    </g>
  ),
  optimization: (
    <g>
      <rect x="7" y="8" width="50" height="48" rx="4" />
      <path d="M7 17h50M14 13h2M20 13h2M26 13h2" />
      <rect x="14" y="37" width="7" height="12" rx="1" />
      <rect x="27" y="33" width="7" height="16" rx="1" />
      <rect x="40" y="29" width="7" height="20" rx="1" />
      <path d="M12 31 24 26 37 23 50 21m-6 0h6v6" />
      <path d="M12 50h39" strokeWidth={1.4} />
    </g>
  ),
  explainability: (
    <g>
      <circle cx="32" cy="32" r="12" />
      <path d="M25 32q7-9 14 0-7 9-14 0" />
      <circle cx="32" cy="32" r="2.5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="52" cy="12" r="5" />
      <circle cx="12" cy="52" r="5" />
      <circle cx="52" cy="52" r="5" />
      <path d="M16 16 23 23M48 16 41 23M16 48l7-7M48 48l-7-7" />
      <path d="M10 12h4M52 10v4M10 52h4M50 52h4" strokeWidth={1.4} />
    </g>
  ),
  'human-approval': (
    <g>
      <defs>
        <clipPath id="qdip-approval-badge-cutout" clipPathUnits="userSpaceOnUse">
          <path
            d="M0 0H64V64H0Z M31.5 42A12.5 12.5 0 1 0 56.5 42A12.5 12.5 0 1 0 31.5 42Z"
            clipRule="evenodd"
            stroke="none"
          />
        </clipPath>
      </defs>
      <g clipPath="url(#qdip-approval-badge-cutout)">
        <rect x="8" y="9" width="38" height="45" rx="3" />
        <path d="M18 9V6h12v3M15 20h24M15 28h24M15 36h24M15 44h24" />
      </g>
      <circle cx="44" cy="42" r="11.7" />
      <path d="m37.7 42 4.2 4.2 9.1-9.1" />
    </g>
  ),
  simulation: (
    <g>
      <rect x="7" y="9" width="50" height="46" rx="4" />
      <path d="M7 19h50M32 19v36" />
      <path d="M13 14h12M39 14h12" strokeWidth={1.4} />
      <circle cx="19" cy="27" r="2.5" />
      <circle cx="45" cy="27" r="2.5" />
      <path d="M12 45 18 38 24 41 28 34M36 45 42 41 48 33 54 37" />
      <path d="M12 49h16M36 49h18" strokeWidth={1.4} />
    </g>
  ),
  allocation: (
    <g>
      <ellipse cx="14" cy="19" rx="9" ry="4" />
      <path d="M5 19v26c0 5 18 5 18 0V19M5 28c0 5 18 5 18 0M5 37c0 5 18 5 18 0" />
      <rect x="42" y="12" width="16" height="15" rx="2" />
      <rect x="42" y="38" width="16" height="15" rx="2" />
      <path d="M23 32h8V19h11M31 32v13h11" />
      <g strokeWidth={1.4}>
        <path d="M47 18h6M47 22h4M47 44h6M47 48h4" />
        <path d="m38 16 4 3-4 3m0 20 4 3-4 3" />
        <circle cx="31" cy="32" r="2.5" />
      </g>
    </g>
  ),
  workflow: (
    <g>
      <rect x="10" y="6" width="44" height="14" rx="3" />
      <rect x="10" y="25" width="44" height="14" rx="3" />
      <rect x="10" y="44" width="44" height="14" rx="3" />
      <path d="M32 20v5M32 39v5" />
      <path d="m29 22 3 3 3-3m-6 19 3 3 3-3" strokeWidth={1.4} />
      <path d="M17 13h10M34 13h13M17 32h10M34 32h13M17 51h10M34 51h13" strokeWidth={1.4} />
    </g>
  ),
  evidence: (
    <g>
      <defs>
        <clipPath id="qdip-evidence-loupe-cutout" clipPathUnits="userSpaceOnUse">
          <path d="M0 0H64V64H0Z M32 43A12 12 0 1 0 56 43A12 12 0 1 0 32 43Z" clipRule="evenodd" stroke="none" />
        </clipPath>
      </defs>
      <g clipPath="url(#qdip-evidence-loupe-cutout)">
        <ellipse cx="25" cy="13" rx="17" ry="5" />
        <path d="M8 13v32c0 7 34 7 34 0V13M8 24c0 7 34 7 34 0M8 35c0 7 34 7 34 0" />
      </g>
      <circle cx="44" cy="43" r="11.3" />
      <path d="m52 51 9 9" />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 6 52 14v16c0 14-8 22-20 28-12-6-20-14-20-28V14z" />
      <path d="M32 12 46 18v12c0 10-5 16-14 21-9-5-14-11-14-21V18z" strokeWidth={1.4} />
      <path d="m23 32 6 6 12-13" />
    </g>
  ),}

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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {artwork[name]}
    </svg>
  )
}
