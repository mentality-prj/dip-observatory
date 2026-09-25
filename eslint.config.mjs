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
    name: '@/design-system/controls',
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
      'react-hooks/set-state-in-effect': 'error',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/design-system/**', 'src/components/ui/**'],
    rules: {
      'no-restricted-imports': ['error', { paths: restrictedDesignSystemImports }],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedDesignSystemImports,
          patterns: [
            {
              group: ['@/app/**'],
              message:
                'Features must not depend on the Next app layer. Move the dependency behind a feature or shared boundary.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedDesignSystemImports,
          patterns: [
            {
              group: ['@/features/**'],
              message: 'Shared infrastructure and lib code must not depend on application features.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedDesignSystemImports,
          patterns: [
            {
              group: [
                '@/features/*/components/**',
                '@/features/*/hooks/**',
                '@/features/*/model/**',
                '@/features/*/server/**',
                '@/studio/**',
              ],
              message: 'App routes may depend only on a feature public API or its explicit top-level server boundary.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/use-cases/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/studio/**'],
              message: "Use-cases must consume Studio through '@/features/studio'.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
