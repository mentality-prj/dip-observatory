import { expect, test } from "@playwright/test";

const locales=["en","uk","pl"] as const;

test.describe("public-site release gates",()=>{
  for(const locale of locales){
    test(`${locale} homepage is product-led, localized and mobile-safe`,async({page})=>{
      await page.setViewportSize({width:375,height:812});
      await page.goto(`/${locale}`);
      await expect(page.locator("#main-content")).toBeVisible();
      await expect(page.getByText("ALLOCATE · DECIDE · PRIORITIZE",{exact:true})).toBeVisible();
      await expect(page.locator(`a[href='/${locale}/decision']`).first()).toBeVisible();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("Ukrainian Resource Allocation CTA keeps Ukrainian locale",async({page})=>{
    await page.goto("/uk");
    await page.getByRole("tab",{name:"РОЗПОДІЛИТИ"}).click();
    const link=page.getByRole("link",{name:/Resource Allocation/}).first();
    await expect(link).toHaveAttribute("href",/\/uk\/resource-allocation$/);
  });

  test("interactive decision playground changes recommendation",async({page})=>{
    await page.goto("/en");
    const toggle=page.getByRole("button",{name:"Change the budget"});
    await expect(page.getByText("Fund the highest-priority 5 requests",{exact:true})).toBeVisible();
    await toggle.click();
    await expect(page.getByText("Fund the highest-priority 8 requests",{exact:true})).toBeVisible();
  });

  test("Resource Allocation publishes clean localized metadata",async({page})=>{
    await page.goto("/uk/resource-allocation");
    await expect(page).toHaveTitle(/Демо розподілу ресурсів/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href","https://observatory.qdip.ai/uk/resource-allocation");
  });
});
