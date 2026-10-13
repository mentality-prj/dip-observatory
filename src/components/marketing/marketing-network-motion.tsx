import styles from './marketing-network-motion.module.css'

/**
 * Decorative decision network for the first viewport.
 * CSS path motion remains visible even if SVG animateMotion is unsupported.
 */
export function MarketingNetworkMotion() {
  const incoming = [
    'M44 78 C154 78 214 134 326 194',
    'M38 194 C174 160 230 194 326 194',
    'M56 302 C178 318 236 240 326 194',
  ]
  const outgoing = [
    'M326 194 C436 130 518 112 602 98',
    'M326 194 C448 194 514 198 614 204',
    'M326 194 C438 278 510 300 604 316',
  ]
  const paths = incoming.concat(outgoing)
  const packets = incoming.slice(0, 2).concat(outgoing.slice(0, 2))

  return (
    <div className={styles.motion} data-testid="marketing-network-motion" aria-hidden="true">
      <svg viewBox="0 0 650 390" preserveAspectRatio="xMidYMid meet" focusable="false">
        <defs>
          <radialGradient id="qdip-marketing-network-glow">
            <stop offset="0" stopColor="#d72e68" stopOpacity=".26" />
            <stop offset="1" stopColor="#d72e68" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="326" cy="194" r="122" fill="url(#qdip-marketing-network-glow)" />
        <g className={styles.basePaths}>
          {paths.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.activePaths}>
          {paths.map((path) => (
            <path key={path} d={path} />
          ))}
        </g>
        <g className={styles.points}>
          <circle cx="44" cy="78" r="7" />
          <circle cx="38" cy="194" r="7" />
          <circle cx="56" cy="302" r="7" />
          <circle cx="602" cy="98" r="7" />
          <circle cx="614" cy="204" r="7" />
          <circle cx="604" cy="316" r="7" />
        </g>
        <circle className={styles.hubPulse} cx="326" cy="194" r="47" />
        <circle className={styles.hubOuter} cx="326" cy="194" r="39" />
        <circle className={styles.hubInner} cx="326" cy="194" r="15" />
        {packets.map((path, index) => (
          <circle className={styles.packet} key={path} r="6">
            <animateMotion dur={`${3.4 + index * 0.6}s`} repeatCount="indefinite" path={path} />
          </circle>
        ))}
      </svg>
    </div>
  )
}
