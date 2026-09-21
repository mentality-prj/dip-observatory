import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const restrictedDesignSystemImports = [
  {
    name: '@/design-system/components',
    message: "Import shared UI from '@/design-system' public API instead.",
  },
  {
    name: '@/design-system/primitives',
    message: "Import shared UI from '@/design-system' public API instead.",
  },
  {
    name: '@/components/platform/product-lockup',
    message: "ProductLockup is owned by the design system. Import it from '@/design-system'.",
  },
  {
    name: '@/components/ui/button',
    message: "Import Button from '@/design-system'.",
  },
  {
    name: '@/components/ui/card',
    message: "Import Card primitives from '@/design-system'.",
  },
  {
    name: '@/components/ui/badge',
    message: "Import Badge from '@/design-system'.",
  },
  {
    name: '@/components/ui/input',
    message: "Import Input from '@/design-system'.",
  },
  {
    name: '@/components/ui/label',
    message: "Import Label from '@/design-system'.",
  },
]

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/design-system/**', 'src/components/ui/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: restrictedDesignSystemImports }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
