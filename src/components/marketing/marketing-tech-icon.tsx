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
      <path d="M16 10h25l7 7v35H16zM41 10v9h7M23 26h18M23 33h11M23 40h9" />
      <circle cx="41" cy="41" r="9" />
      <path d="m37 41 3 3 6-7" />
    </g>
  ),
  comparison: (
    <g>
      <path d="M8 30h16V13H8zM40 51h16V34H40zM28 12v40M24 17l4-5 4 5M24 47l4 5 4-5" />
      <path d="M12 24l4-5 4 3M44 45l4-6 4 4" />
      <path d="M9 41h11M44 20h11" />
      <circle cx="16" cy="41" r="3" />
      <circle cx="48" cy="20" r="3" />
    </g>
  ),
  replay: (
    <g>
      <path d="M20 16A22 22 0 1 1 10 35M10 19v16h16" />
      <circle cx="34" cy="34" r="13" />
      <path d="M34 22v12l9 5M16 51l-5 5M48 11l5-4" />
      <circle cx="34" cy="34" r="2" />
    </g>
  ),
  modeling: (
    <g>
      <rect x="9" y="9" width="14" height="14" rx="2" />
      <rect x="41" y="9" width="14" height="14" rx="2" />
      <rect x="25" y="39" width="14" height="14" rx="2" />
      <path d="M23 16h18M16 23v9h16v7M48 23v9H32" />
      <circle cx="32" cy="32" r="3" />
    </g>
  ),
  constraints: (
    <g>
      <path d="M8 19h48M8 45h48M19 8v48M45 8v48" />
      <path d="M23 33l7 7 13-16" />
      <circle cx="19" cy="19" r="4" />
      <circle cx="45" cy="45" r="4" />
      <path d="M8 8h7M49 56h7" />
    </g>
  ),
  optimization: (
    <g>
      <path d="M9 52V12M9 52h46M16 42l10-9 10 4 14-19M45 18h5v5" />
      <path d="M16 42v10M26 33v19M36 37v15M50 18v34" />
      <circle cx="16" cy="42" r="3" />
      <circle cx="26" cy="33" r="3" />
      <circle cx="36" cy="37" r="3" />
      <circle cx="50" cy="18" r="3" />
    </g>
  ),
  explainability: (
    <g>
      <path d="M13 10h38v31H35l-9 11v-11H13zM20 19h24M20 26h17M20 33h8" />
      <circle cx="43" cy="33" r="9" />
      <path d="M40 30a3 3 0 0 1 6 1c0 3-3 3-3 6M43 40v1" />
    </g>
  ),
  'human-approval': (
    <g>
      <circle cx="21" cy="18" r="8" />
      <path d="M8 46v-7c0-9 6-14 13-14 5 0 9 2 11 6" />
      <path d="m35 12 15 5v12c0 11-8 19-15 22-8-3-15-11-15-22v-2" />
      <path d="m27 32 6 6 11-14" />
      <circle cx="49" cy="49" r="3" />
    </g>
  ),
  simulation: (
    <g>
      <path d="M10 14h44v36H10zM17 23h10M17 31h8M17 39h8" />
      <path d="M33 38l7-9 8 4M33 38l8 5 7-8" />
      <circle cx="33" cy="38" r="2" />
      <circle cx="40" cy="29" r="2" />
      <circle cx="48" cy="33" r="2" />
      <circle cx="41" cy="43" r="2" />
    </g>
  ),
  allocation: (
    <g>
      <rect x="8" y="12" width="14" height="14" rx="2" />
      <rect x="42" y="9" width="14" height="14" rx="2" />
      <rect x="42" y="41" width="14" height="14" rx="2" />
      <path d="M22 19h10v-3h10M32 19v29h10M12 34v19h18M22 47l8 6 8-6" />
      <circle cx="32" cy="19" r="3" />
    </g>
  ),
  workflow: (
    <g>
      <rect x="8" y="23" width="14" height="18" rx="2" />
      <rect x="42" y="9" width="14" height="18" rx="2" />
      <rect x="42" y="37" width="14" height="18" rx="2" />
      <path d="M22 32h10V18h10M32 32v14h10" />
      <circle cx="32" cy="32" r="4" />
      <path d="m12 31 3 3 4-5M46 18h6M46 46h6" />
    </g>
  ),
  evidence: (
    <g>
      <path d="M15 9h28l7 7v39H15zM43 9v9h7M22 25h19M22 31h13M22 37h10" />
      <circle cx="41" cy="43" r="8" />
      <path d="m47 49 8 8M37 43h8" />
    </g>
  ),
  policy: (
    <g>
      <path d="M32 7 51 14v17c0 12-8 20-19 26-11-6-19-14-19-26V14z" />
      <path d="M23 28h18M23 35h13M23 21h18M29 14h6M36 42l4 4 7-9" />
      <circle cx="19" cy="43" r="3" />
    </g>
  ),
}

export function MarketingTechIcon({
  name,
  className,
}: {
  name: TechIconName
  className?: string
}) {
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
