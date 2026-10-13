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
        <mask id="qdip-audit-loupe-cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" stroke="none" />
          <circle cx="44" cy="42" r="11.2" fill="black" stroke="none" />
        </mask>
      </defs>
      <g mask="url(#qdip-audit-loupe-cutout)">
        <rect x="8" y="11" width="37" height="43" rx="3" />
        <path d="M19 11V7h9v4M18 7h11" />
        <rect x="13" y="19" width="8" height="8" rx="1" />
        <rect x="13" y="30" width="8" height="8" rx="1" />
        <rect x="13" y="41" width="8" height="8" rx="1" />
        <path
          d="m14.6 23 2 2 3.5-4M14.6 34l2 2 3.5-4M14.6 45l2 2 3.5-4"
          strokeWidth={1.3}
        />
        <path d="M26 23h12M26 34h12M26 45h12" />
      </g>
      <circle cx="44" cy="42" r="10.5" />
      <path d="m51.6 49.6 9 9" />
    </g>
  ),
  comparison: (
    <g>
      <path d="M32 8v44M19 55h26M23 50h18M32 8l-23 13h46L32 8" />
      <circle cx="32" cy="10" r="3.5" />
      <path d="M11 21 5 39h15zM53 21l-6 18h15zM5 39q7 10 15 0M47 39q7 10 15 0" />
      <g strokeWidth={1.4}>
        <path d="M18 17 7 37M46 17l11 20M26 42h12M24 46h16" />
        <circle cx="32" cy="25" r="2.5" />
      </g>
    </g>
  ),
  replay: (
    <g>
      <path d="M12 25a22 22 0 0 1 36-11l4 4M52 9v9h-9M52 39a22 22 0 0 1-36 11l-4-4M12 55v-9h9" />
      <circle cx="32" cy="32" r="16" />
      <path d="m27 23 15 9-15 9z" />
      <g strokeWidth={1.4}>
        <path d="M32 12v4M32 48v4M12 32h4M48 32h4" />
        <circle cx="10" cy="11" r="1.5" />
        <circle cx="54" cy="53" r="1.5" />
      </g>
    </g>
  ),
  modeling: (
    <g>
      <path d="M32 7 53 19 32 31 11 19zM11 19v26l21 12 21-12V19M32 31v26" />
      <path d="m21 13 21 12M43 13 22 25" strokeWidth={1.4} />
      <circle cx="21" cy="36" r="5" />
      <circle cx="43" cy="36" r="5" />
      <g strokeWidth={1.4}>
        <path d="M21 28v3M21 41v3M13 36h3M26 36h3M43 28v3M43 41v3M35 36h3M48 36h3" />
        <circle cx="21" cy="36" r="1.6" />
        <circle cx="43" cy="36" r="1.6" />
        <path d="M17 49l5 3M42 52l5-3" />
      </g>
    </g>
  ),
  constraints: (
    <g>
      <rect x="8" y="12" width="39" height="12" rx="2" />
      <rect x="8" y="28" width="39" height="12" rx="2" />
      <rect x="8" y="44" width="39" height="12" rx="2" />
      <path d="M15 18h9M15 34h9M15 50h9M29 18h11M29 34h11M29 50h11" />
      <path d="m53 15 8 14H45zM53 20v4M53 27v1M53 43l7 12H46z" />
      <g strokeWidth={1.4}>
        <path d="M4 18h4M4 34h4M4 50h4M47 18h4" />
        <circle cx="53" cy="48" r="1.5" />
        <path d="M53 52v1" />
      </g>
    </g>
  ),
  optimization: (
    <g>
      <rect x="7" y="8" width="50" height="48" rx="3" />
      <path d="M7 17h50M14 13h2M20 13h2M26 13h2M14 49V35h7v14M26 49V30h7v19M38 49V25h7v24" />
      <path d="m13 32 11-10 10 5 13-13m-8 0h8v8" />
      <g strokeWidth={1.4}>
        <path d="M14 52h37M49 30h4M49 35h4M49 40h4" />
        <circle cx="14" cy="32" r="2" />
        <circle cx="24" cy="22" r="2" />
        <circle cx="34" cy="27" r="2" />
      </g>
    </g>
  ),
  explainability: (
    <g>
      <circle cx="32" cy="32" r="11" />
      <circle cx="32" cy="32" r="3" />
      <circle cx="10" cy="12" r="5" />
      <circle cx="54" cy="12" r="5" />
      <circle cx="10" cy="52" r="5" />
      <circle cx="54" cy="52" r="5" />
      <path d="M14 16 24 25M50 16 40 25M14 48l10-9M50 48l-10-9" />
      <g strokeWidth={1.4}>
        <path d="M29 24q3-5 6 0M29 40q3 3 6 0M25 32h14M10 9v6M7 12h6M51 12h6M10 49v6M7 52h6M51 52h6" />
        <path d="M29 19V9M35 45v10" strokeDasharray="2 4" />
      </g>
    </g>
  ),
  'human-approval': (
    <g>
      <defs>
        <mask id="qdip-approval-badge-cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" stroke="none" />
          <circle cx="44" cy="42" r="12.5" fill="black" stroke="none" />
        </mask>
      </defs>
      <g mask="url(#qdip-approval-badge-cutout)">
        <rect x="8" y="9" width="38" height="45" rx="3" />
        <path d="M18 9V6h12v3M15 20h24M15 28h24M15 36h24M15 44h24" />
      </g>
      <circle cx="44" cy="42" r="11.7" />
      <path d="m37.7 42 4.2 4.2 9.1-9.1" />
    </g>
  ),
  simulation: (
    <g>
      <rect x="7" y="8" width="50" height="48" rx="4" />
      <path d="M7 18h50M32 18v38" />
      <path d="m13 29 6-6 6 6M13 44l6-6 6 6M38 43l5-8 8 3" />
      <g strokeWidth={1.4}>
        <path d="M13 13h15M34 13h15M19 29v9M25 30l-6 8M43 35l7-9" />
        <circle cx="19" cy="38" r="2.5" />
        <circle cx="43" cy="35" r="2.5" />
        <circle cx="50" cy="26" r="2.5" />
        <circle cx="50" cy="38" r="2.5" />
      </g>
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
      <rect x="8" y="9" width="22" height="13" rx="3" />
      <rect x="34" y="26" width="22" height="13" rx="3" />
      <rect x="8" y="43" width="22" height="13" rx="3" />
      <path d="M30 16h10v10M45 39v10H30M18 43v-9h16" />
      <path d="m36 23 4 3 4-3m-17 23 3 3-3 3M15 15h8M41 32h8M15 49h8" />
      <g strokeWidth={1.4}>
        <path d="M12 22v17h6M51 26v-9H46" strokeDasharray="2 3" />
        <circle cx="18" cy="34" r="2" />
        <circle cx="46" cy="17" r="2" />
      </g>
    </g>
  ),
  evidence: (
    <g>
      <defs>
        <mask id="qdip-evidence-loupe-cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="white" stroke="none" />
          <circle cx="44" cy="43" r="12" fill="black" stroke="none" />
        </mask>
      </defs>
      <g mask="url(#qdip-evidence-loupe-cutout)">
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
      <path d="m22 31 7 7 14-16" />
      <g strokeWidth={1.4}>
        <path d="M32 12 46 18v12c0 10-5 16-14 21-9-5-14-11-14-21V18z" />
        <path d="M32 3v3M10 10l4 3M54 10l-4 3M8 32h4M52 32h4" />
        <circle cx="32" cy="51" r="1.5" />
      </g>
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {artwork[name]}
    </svg>
  )
}
