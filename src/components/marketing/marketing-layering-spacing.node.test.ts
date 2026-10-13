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
