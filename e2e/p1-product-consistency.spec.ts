import { expect, test } from '@playwright/test'

const heroCta = {
  en: 'See QDIP in action',
  uk: 'Подивитися QDIP у дії',
  pl: 'Zobacz QDIP w działaniu',
} as const

const demoNames = {
  en: ['Resource Allocation', 'Gas Decision', 'GTM Lab'],
  uk: ['Розподіл ресурсів', 'Gas Decision', 'GTM Lab'],
  pl: ['Resource Allocation', 'Gas Decision', 'GTM Lab'],
} as const

const proofArtifacts = {
  en: ['Audit trace', 'Baseline comparison', 'Deterministic replay'],
  uk: ['Audit trace', 'Порівняння з baseline', 'Детермінований replay'],
  pl: ['Audit trace', 'Porównanie z baseline', 'Deterministyczny replay'],
} as const

const decisionPreview = {
  en: 'Recommended allocation plan',
  uk: 'Рекомендований план розподілу',
  pl: 'Rekomendowany plan alokacji',
} as const

const footerLabels = {
  en: ['How it works', 'Use cases', 'QDIP Core', 'Research'],
  uk: ['Як це працює', 'Сценарії', 'QDIP Core', 'Дослідження'],
  pl: ['Jak to działa', 'Przypadki użycia', 'QDIP Core', 'Badania'],
} as const

const locales = ['en', 'uk', 'pl'] as const

test.describe('P1 marketing conversion gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} hero CTA opens localized Observatory directly`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.getByRole('link', { name: heroCta[locale] })).toHaveAttribute(
        'href',
        `https://observatory.qdip.ai/${locale}`
      )

      const proof = page.locator('#why')
      await expect(proof.locator('article')).toHaveCount(3)
      for (const artifact of proofArtifacts[locale]) {
        await expect(proof.getByText(artifact, { exact: true })).toBeVisible()
      }
    })
  }
})

test.describe('P1 Observatory consistency gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'observatory.qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} uses canonical public demo names and a concrete decision preview`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBeLessThan(400)

      for (const name of demoNames[locale]) {
        await expect(page.getByRole('heading', { level: 3, name })).toBeVisible()
      }

      await expect(page.getByText(decisionPreview[locale], { exact: true })).toBeVisible()
      await expect(page.locator('[data-use-case="resource-allocation"]')).toBeVisible()
    })
  }
})

test.describe('P1 Studio localization gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'studio.qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} footer uses the active Studio locale`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBeLessThan(400)
      await expect(page).toHaveURL(new RegExp(`/${locale}/profilesimport { expect, test } from '@playwright/test'

const heroCta = {
  en: 'See QDIP in action',
  uk: 'Подивитися QDIP у дії',
  pl: 'Zobacz QDIP w działaniu',
} as const

const demoNames = {
  en: ['Resource Allocation', 'Gas Decision', 'GTM Lab'],
  uk: ['Розподіл ресурсів', 'Gas Decision', 'GTM Lab'],
  pl: ['Resource Allocation', 'Gas Decision', 'GTM Lab'],
} as const

const proofArtifacts = {
  en: ['Audit trace', 'Baseline comparison', 'Deterministic replay'],
  uk: ['Audit trace', 'Порівняння з baseline', 'Детермінований replay'],
  pl: ['Audit trace', 'Porównanie z baseline', 'Deterministyczny replay'],
} as const

const decisionPreview = {
  en: 'Recommended allocation plan',
  uk: 'Рекомендований план розподілу',
  pl: 'Rekomendowany plan alokacji',
} as const

const footerLabels = {
  en: ['How it works', 'Use cases', 'QDIP Core', 'Research'],
  uk: ['Як це працює', 'Сценарії', 'QDIP Core', 'Дослідження'],
  pl: ['Jak to działa', 'Przypadki użycia', 'QDIP Core', 'Badania'],
} as const

const locales = ['en', 'uk', 'pl'] as const

test.describe('P1 marketing conversion gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} hero CTA opens localized Observatory directly`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBeLessThan(400)
      await expect(page.getByRole('link', { name: heroCta[locale] })).toHaveAttribute(
        'href',
        `https://observatory.qdip.ai/${locale}`
      )

      const proof = page.locator('#why')
      await expect(proof.locator('article')).toHaveCount(3)
      for (const artifact of proofArtifacts[locale]) {
        await expect(proof.getByText(artifact, { exact: true })).toBeVisible()
      }
    })
  }
})

test.describe('P1 Observatory consistency gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'observatory.qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} uses canonical public demo names and a concrete decision preview`, async ({ page }) => {
      const response = await page.goto(`/${locale}`)
      expect(response?.status()).toBeLessThan(400)

      for (const name of demoNames[locale]) {
        await expect(page.getByRole('heading', { level: 3, name })).toBeVisible()
      }

      await expect(page.getByText(decisionPreview[locale], { exact: true })).toBeVisible()
      await expect(page.locator('[data-use-case="resource-allocation"]')).toBeVisible()
    })
  }
})

test.describe('P1 Studio localization gate', () => {
  test.use({ extraHTTPHeaders: { 'x-forwarded-host': 'studio.qdip.ai' } })

  for (const locale of locales) {
    test(`${locale} footer uses the active Studio locale`, async ({ page }) => {
))

      const footer = page.locator('.studio-site-footer')
      await expect(footer).toBeVisible()
      for (const label of footerLabels[locale]) {
        await expect(footer.getByRole('link', { name: label })).toBeVisible()
      }
    })
  }
})
