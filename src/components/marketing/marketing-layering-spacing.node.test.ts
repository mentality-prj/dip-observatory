import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const globals = readFileSync('src/app/globals.css', 'utf8')
const spacing = readFileSync('src/components/marketing/decision-inquiry-spacing.module.css', 'utf8')
const marketing = readFileSync('src/components/marketing/marketing-atmosphere.module.css', 'utf8')
const hero = readFileSync('src/components/marketing/qdip-site.module.css', 'utf8')
const visual = readFileSync('src/components/marketing/signature-decision-visual.module.css', 'utf8')

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

test('decision inquiry form does not reintroduce a full section gap', () => {
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y\) \+ var\(--ds-space-4\)\)/)
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y-mobile\) \+ var\(--ds-space-3\)\)/)
})
