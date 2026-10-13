import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const globals = readFileSync('src/app/globals.css', 'utf8')
const spacing = readFileSync('src/components/marketing/decision-inquiry-spacing.module.css', 'utf8')
const marketing = readFileSync('src/components/marketing/marketing-atmosphere.module.css', 'utf8')
const hero = readFileSync('src/components/marketing/qdip-site.module.css', 'utf8')
const visual = readFileSync('src/components/marketing/signature-decision-visual.module.css', 'utf8')
const network = readFileSync('src/components/marketing/marketing-network-motion.module.css', 'utf8')
const networkMarkup = readFileSync('src/components/marketing/marketing-network-motion.tsx', 'utf8')
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

test('marketing hero uses a full-width decision visual with reduced-motion fallback', () => {
  assert.match(hero, /grid-template-columns:\s*minmax\(0, 1fr\)/)
  assert.match(visual, /\.livePath\s*\{[^}]*animation:/)
  assert.match(visual, /prefers-reduced-motion:\s*reduce/)
})

test('desktop hero retains decision network, mobile removes overlapping animation', () => {
  assert.match(hero, /grid-template-areas:\s*'copy network'\s*'scene scene'/)
  assert.match(hero, /\.heroMotion\s*\{/)
  assert.match(network, /\.activePaths path\s*\{[^}]*animation:/)
  assert.match(networkMarkup, /data-testid="marketing-network-motion"/)
  assert.match(network, /prefers-reduced-motion:\s*reduce/)
  assert.match(hero, /@media \(max-width: 900px\)\s*\{[\s\S]*?\.heroMotion\s*\{\s*display:\s*none;/)
  assert.doesNotMatch(visual, /\.arrow\s*\{[^}]*animation:\s*qdip-mobile-flow/)
})

test('marketing CTA effects are subtle, accessible and disabled with reduced motion', () => {
  assert.match(cta, /\.primary:hover::after/)
  assert.match(cta, /\.primary:active,/)
  assert.match(cta, /prefers-reduced-motion:\s*reduce/)
  assert.match(hero, /\.heroSignature\s*\{/)
})

test('decision inquiry form does not reintroduce a full section gap', () => {
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y\) \+ var\(--ds-space-4\)\)/)
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y-mobile\) \+ var\(--ds-space-3\)\)/)
})
