import { expect, test } from "@playwright/test";

test.describe("public conversion funnel",()=>{
 for(const locale of ["en","uk","pl"] as const){test(`${locale} homepage exposes pilot path and decision CTA`,async({page})=>{await page.goto(`/${locale}`);await expect(page.locator("main")).toBeVisible();const decisionLink=page.locator(`a[href='/${locale}/decision']`).first();await expect(decisionLink).toBeVisible();await expect(decisionLink).toHaveAttribute("href",`/${locale}/decision`)})}
});
