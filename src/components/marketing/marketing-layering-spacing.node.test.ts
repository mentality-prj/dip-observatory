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

test('resource allocation glyph uses balanced connectors with no criss-cross arrow', () => {
  assert.match(techIcons, /M23 32h8V19h11M31 32v13h11/)
  assert.match(hero, /url\('\/qdip-network\.svg'\)/)
})

test('playground workflow and controls use theme-aware text colors', () => {
  assert.match(playgroundStyle, /\.stage :global\(\.ds-workflow-step strong\)\s*\{\s*color:\s*var\(--qdip-text\);/)
  assert.match(playgroundStyle, /\.controls button\s*\{[\s\S]*?color:\s*var\(--qdip-text\);/)
  assert.doesNotMatch(playgroundStyle, /\.stage :global\(\.ds-workflow-step strong\)\s*\{\s*color:\s*#fff;/)
})

const marketingAuth = readFileSync('src/components/auth/qdip-auth-control.tsx', 'utf8')
const marketingHeader = readFileSync('src/components/marketing/marketing-header.tsx', 'utf8')

test('marketing identity access is icon-only and screen-reader-labelled, without changing product login', () => {
  assert.match(marketingHeader, /<QdipAuthControl locale=\{locale\} returnTo=\{returnTo\} iconOnly \/>/)
  assert.match(marketingAuth, /iconOnly = false/)
  assert.match(marketingAuth, /<QdipAccessIcon \/>/)
  assert.match(marketingAuth, /aria-label=\{copy\.signIn\}/)
  assert.match(marketingAuth, /!iconOnly && <span>\{copy\.signIn\}<\/span>/)
})

test('inspection loupes and approval badge overlap the source art but hide strokes beneath them', () => {
  for (const [maskId, lens] of [
    ['qdip-audit-loupe-cutout', '<circle cx="44" cy="42" r="10.5" />'],
    ['qdip-evidence-loupe-cutout', '<circle cx="44" cy="43" r="11.3" />'],
    ['qdip-approval-badge-cutout', '<circle cx="44" cy="42" r="11.7" />'],
  ]) {
    assert.ok(techIcons.includes(`<mask id="${maskId}"`), `Missing cutout for ${maskId}`)
    assert.ok(techIcons.includes(`mask="url(#${maskId})"`), `Source art is not masked for ${maskId}`)
    assert.ok(techIcons.includes(lens), `Overlapping lens/badge missing for ${maskId}`)
  }
  assert.match(techIcons, /<rect x="8" y="11" width="37" height="43" rx="3" \/>/)
  assert.match(techIcons, /<ellipse cx="25" cy="13" rx="17" ry="5" \/>/)
  assert.match(techIcons, /<rect x="8" y="9" width="38" height="45" rx="3" \/>/)
  assert.match(techIcons, /<circle cx="44" cy="43" r="12" fill="black" stroke="none" \/>/)
})
