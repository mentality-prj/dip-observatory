import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const globals = readFileSync('src/app/globals.css', 'utf8')
const spacing = readFileSync('src/components/marketing/decision-inquiry-spacing.module.css', 'utf8')
const marketing = readFileSync('src/components/marketing/marketing-atmosphere.module.css', 'utf8')
const hero = readFileSync('src/components/marketing/qdip-site.module.css', 'utf8')
const homepage = readFileSync('src/components/marketing/qdip-site.tsx', 'utf8')
const workbench = readFileSync('src/components/marketing/decision-workbench-preview.tsx', 'utf8')
const workbenchStyle = readFileSync('src/components/marketing/decision-workbench-preview.module.css', 'utf8')
const cta = readFileSync('src/components/marketing/marketing-cta-motion.module.css', 'utf8')

test('network texture remains visible below application content', () => {
  assert.match(globals, /body::before\s*\{[\s\S]*?z-index:\s*0;/)
  assert.match(globals, /body\s*>\s*\*\s*\{[\s\S]*?z-index:\s*1;/)
  assert.doesNotMatch(globals, /body::before\s*\{[\s\S]*?z-index:\s*-1;/)
})

test('marketing surfaces render network between surface and content', () => {
  assert.match(marketing, /\.atmosphere\s*\{[^}]*isolation:\s*isolate;/)
  assert.match(marketing, /\.atmosphere::before\s*\{[^}]*background:\s*url\('\/qdip-network\.svg'\)/)
  assert.match(marketing, /\.atmosphere::before\s*\{[^}]*z-index:\s*0;/)
  assert.match(marketing, /\.atmosphere\s*>\s*main\s*\{[^}]*z-index:\s*1;/)
})

test('marketing hero foregrounds an interactive product console instead of animated decoration', () => {
  assert.match(homepage, /<DecisionWorkbenchPreview locale=\{locale\}/)
  assert.doesNotMatch(homepage, /<MarketingNetworkMotion/)
  assert.doesNotMatch(homepage, /<SignatureDecisionVisual/)
  assert.match(hero, /\.engineeredHero\s*\{[^}]*display:\s*block;/)
  assert.match(hero, /\.engineeredHero\s*\{[^}]*background:/)
  assert.match(workbenchStyle, /\.workspace\s*\{[^}]*grid-template-columns:/)
  assert.match(workbenchStyle, /@media \(max-width:\s*670px\)/)
})

test('example console is genuinely interactive but makes no backend execution claim', () => {
  assert.match(workbench, /useState<40 \| 70>\(40\)/)
  assert.match(workbench, /aria-pressed=\{budget === value\}/)
  assert.match(workbench, /data-testid="decision-workbench"/)
  assert.match(workbench, /Example data, not a live QDIP execution/)
  assert.match(workbenchStyle, /prefers-reduced-motion:\s*reduce/)
})

test('marketing CTA effects are subtle, accessible and disabled with reduced motion', () => {
  assert.match(cta, /\.primary:hover::after/)
  assert.match(cta, /\.primary:active,/)
  assert.match(cta, /prefers-reduced-motion:\s*reduce/)
  assert.match(hero, /\.heroProtocol\s*\{/)
})

test('decision inquiry form does not reintroduce a full section gap', () => {
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y\) \+ var\(--ds-space-4\)\)/)
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y-mobile\) \+ var\(--ds-space-3\)\)/)
})

const deepBurgundy = readFileSync('src/components/marketing/marketing-deep-burgundy.module.css', 'utf8')
const deepConsole = readFileSync('src/components/marketing/decision-workbench-preview.module.css', 'utf8')
const customIcons = readFileSync('src/components/marketing/marketing-tech-icon.tsx', 'utf8')
const evidenceMarkup = readFileSync('src/components/marketing/evidence-strip.tsx', 'utf8')
const homepageMarkup = readFileSync('src/components/marketing/qdip-site.tsx', 'utf8')
const techIcons = readFileSync('src/components/marketing/marketing-tech-icon.tsx', 'utf8')
const playgroundStyle = readFileSync('src/components/marketing/decision-playground.module.css', 'utf8')

test('Deep Burgundy identity is isolated to marketing and uses exact brand tokens', () => {
  for (const token of ['#15171c', '#20232a', '#7a1838', '#c65176', '#f5f6f8', '#ffffff']) {
    assert.ok(deepBurgundy.includes(token), `Missing token ${token}`)
  }
  assert.match(deepBurgundy, /\.theme\.theme\.theme/)
  assert.match(homepageMarkup, /mode="dark"/)
  assert.doesNotMatch(deepConsole, /#0c131d|#293442|#9de2cf|#82d5c4/)
  assert.match(deepConsole, /background:\s*#20232a;/)
  assert.match(deepBurgundy, /data-marketing-appearance='light'/)
  assert.match(deepBurgundy, /--qdip-button:\s*#7a1838/)
})

test('EvidenceStrip uses 64px hand-built engineering illustrations, not tiny library symbols', () => {
  assert.match(customIcons, /viewBox="0 0 64 64"/)
  assert.match(customIcons, /strokeWidth=\{2\}/)
  assert.match(evidenceMarkup, /'audit', 'comparison', 'replay'/)
  assert.doesNotMatch(evidenceMarkup, /lucide-react/)
  for (const name of [
    'modeling',
    'constraints',
    'optimization',
    'explainability',
    'human-approval',
    'simulation',
    'allocation',
    'workflow',
    'evidence',
    'policy',
  ]) {
    assert.ok(customIcons.includes(`  ${name}:`) || customIcons.includes(`  '${name}':`), `Missing ${name}`)
  }
})

test('marketing retains neutral card geometry and burgundy actions in both themes', () => {
  assert.match(hero, /\.evidenceGrid article,[\s\S]*?background:\s*var\(--qdip-surface\);/)
  assert.match(hero, /\.engineeredHero \.primaryButtonLarge\s*\{[^}]*background:\s*var\(--qdip-button\);/)
  assert.doesNotMatch(hero, /background:\s*#ed9bb7;/)
})

test('branded decision network is not replaced by a generic square grid', () => {
  assert.match(hero, /\.engineeredHero::before\s*\{[^}]*url\('\/qdip-network\.svg'\)/)
  assert.match(hero, /\.patternSection\s*\{\s*background:\s*url\('\/qdip-network\.svg'\)/)
  assert.doesNotMatch(hero, /background-size:\s*48px 48px/)
})

test('resource allocation glyph uses one source and three clearly separated destinations', () => {
  const allocation = techIcons.slice(techIcons.indexOf('  allocation: ('), techIcons.indexOf('  workflow: ('))
  assert.equal((allocation.match(/<rect /g) ?? []).length, 4)
  assert.match(allocation, /M26 33h10M36 16v34/)
  assert.match(allocation, /fill=\{accent\}/)
  assert.doesNotMatch(allocation, /strokeWidth=\{1\.4\}/)
})
test('playground workflow and controls use theme-aware text colors', () => {
  assert.match(playgroundStyle, /\.stage :global\(\.ds-workflow-step strong\)\s*\{\s*color:\s*var\(--qdip-text\);/)
  assert.match(playgroundStyle, /\.controls button\s*\{[\s\S]*?color:\s*var\(--qdip-text\);/)
  assert.doesNotMatch(playgroundStyle, /\.stage :global\(\.ds-workflow-step strong\)\s*\{\s*color:\s*#fff;/)
})

const marketingAuth = readFileSync('src/components/auth/qdip-auth-control.tsx', 'utf8')
const marketingHeader = readFileSync('src/components/marketing/marketing-header.tsx', 'utf8')

test('marketing identity access uses a compact vector SVG without changing product sign-in', () => {
  assert.match(marketingHeader, /<QdipAuthControl locale=\{locale\} returnTo=\{returnTo\} iconOnly \/>/)
  assert.match(marketingAuth, /iconOnly = false/)
  assert.match(marketingAuth, /auth-smile-lock\.svg/)
  assert.match(marketingAuth, /aria-label=\{copy\.signIn\}/)
  assert.match(marketingAuth, /!iconOnly && <span>\{copy\.signIn\}<\/span>/)
})
test('audit, approval and evidence glyphs use simple semantic forms without SVG masking', () => {
  const audit = techIcons.slice(techIcons.indexOf('  audit: ('), techIcons.indexOf('  comparison: ('))
  const approval = techIcons.slice(techIcons.indexOf("  'human-approval': ("), techIcons.indexOf('  simulation: ('))
  const evidence = techIcons.slice(techIcons.indexOf('  evidence: ('), techIcons.indexOf('  policy: ('))
  assert.match(audit, /<circle cx="42" cy="42" r="11"/)
  assert.match(approval, /<circle cx="44" cy="44" r="11"/)
  assert.match(evidence, /M40 8v10h9/)
  assert.doesNotMatch(techIcons, /clipPath|clipRule|<mask/)
})
test('comparison pairs two aligned cards with a restrained outcome accent', () => {
  const comparison = techIcons.slice(techIcons.indexOf('  comparison: ('), techIcons.indexOf('  replay: ('))
  assert.equal((comparison.match(/<rect /g) ?? []).length, 2)
  assert.match(comparison, /M14 43v-9h8v9M42 43V29h8v14/)
  assert.doesNotMatch(comparison, /scale\(-1 1\)/)
})
test('simulation represents two branching scenario paths from one shared origin', () => {
  const simulation = techIcons.slice(techIcons.indexOf('  simulation: ('), techIcons.indexOf('  allocation: ('))
  assert.equal((simulation.match(/<circle /g) ?? []).length, 3)
  assert.match(simulation, /M17 32h10c5 0 7-12 13-12h7/)
  assert.match(simulation, /M17 32h10c5 0 7 12 13 12h7/)
  assert.doesNotMatch(simulation, /<rect /)
})
test('all 13 decision glyphs have a common optical grid and a single accent', () => {
  const entries = techIcons.match(/^  (?:'[a-z-]+'|[a-z-]+): \($/gm) ?? []
  assert.equal(entries.length, 13)
  assert.match(techIcons, /viewBox="0 0 64 64"/)
  assert.match(techIcons, /strokeWidth=\{2\.5\}/)
  assert.match(techIcons, /const accent = 'var\(--qdip-signal, #c65176\)'/)
  assert.doesNotMatch(techIcons, /strokeWidth=\{1\.4\}|clipPath|clipRule/)
})
test('marketing SVG icon gallery reflects all 13 redrawn symbols', () => {
  const gallery = readFileSync('public/marketing-icon-gallery.svg', 'utf8')
  assert.equal((gallery.match(/<g data-icon="/g) ?? []).length, 13)
  assert.match(gallery, /stroke-width="2\.5"/)
  assert.match(gallery, /#c65176/)
  assert.doesNotMatch(gallery, /clip-path|clipPath|<image/)
})
