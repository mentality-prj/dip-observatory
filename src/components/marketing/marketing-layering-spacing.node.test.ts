import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const globals = readFileSync('src/app/globals.css', 'utf8')
const spacing = readFileSync('src/components/marketing/decision-inquiry-spacing.module.css', 'utf8')

test('network texture remains visible below application content', () => {
  assert.match(globals, /body::before\s*\{[\s\S]*?z-index:\s*0;/)
  assert.match(globals, /body\s*>\s*\*\s*\{[\s\S]*?z-index:\s*1;/)
  assert.doesNotMatch(globals, /body::before\s*\{[\s\S]*?z-index:\s*-1;/)
})

test('decision inquiry form does not reintroduce a full section gap', () => {
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y\) \+ var\(--ds-space-4\)\)/)
  assert.match(spacing, /margin-top:\s*calc\(-1 \* var\(--section-y-mobile\) \+ var\(--ds-space-3\)\)/)
})
