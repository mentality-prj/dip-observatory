import { expect,test } from "@playwright/test";

const locales=["en","uk","pl"] as const;
const demos=[
 ["Resource Allocation","/resource-allocation"],
 ["Gas Decision","/gas-forecast"],
 ["GTM Lab","/gtm-lab"],
] as const;

test.describe("marketing routing and SEO",()=>{
 for(const locale of locales){
  test(`${locale} marketing route stays canonical`,async({page})=>{
   const response=await page.goto(`/${locale}/how-it-works`);
   expect(response?.status()).toBeLessThan(400);
   await expect(page).toHaveURL(new RegExp(`/${locale}/how-it-works/?$`));
   await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",`https://qdip.ai/${locale}/how-it-works`);
  });

  test(`${locale} use-case demos route to Observatory`,async({page})=>{
   const response=await page.goto(`/${locale}/use-cases#demos`);
   expect(response?.status()).toBeLessThan(400);

   for(const [title,path] of demos){
    await expect(page.getByRole("link",{name:`Open ${title}`})).toHaveAttribute("href",`https://observatory.qdip.ai${path}`);
   }
  });
 }
 test("legacy platform URL redirects directly to clean URL",async({request})=>{
  const response=await request.get("/platform/en/how-it-works",{maxRedirects:0});
  expect(response.status()).toBe(308);
  expect(response.headers().location).toContain("/en/how-it-works");
 });
 test("sitemap does not expose internal platform routes",async({request})=>{
  const response=await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const body=await response.text();
  expect(body).toContain("https://qdip.ai/en/how-it-works");
  expect(body).not.toContain("/platform/");
 });
});
