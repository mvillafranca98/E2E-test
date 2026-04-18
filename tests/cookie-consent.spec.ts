import { test, expect } from '@playwright/test';
import { cookieBannerSelectors as sel } from '../helpers/cookie-banner';

test.describe('cookie consent banner', () => {
  test('appears on first visit with Accept / Decline / Customize', async ({ page }) => {
    await page.goto('/');
    const frame = page.frameLocator(sel.iframe);
    await expect(frame.locator(sel.accept)).toBeVisible();
    await expect(frame.locator(sel.decline)).toBeVisible();
    await expect(frame.locator('#sp-customize')).toBeVisible();
  });

  test('accept hides the banner and records ConsentGiven=true', async ({ page }) => {
    await page.goto('/');
    await page.frameLocator(sel.iframe).locator(sel.accept).click();

    await expect(page.locator(sel.wrapper)).toBeHidden();
    const consent = await page.evaluate(() => localStorage.getItem('sp_consent'));
    expect(consent).toContain('"ConsentGiven":true');
  });

  test('decline hides the banner and records ConsentGiven=false', async ({ page }) => {
    await page.goto('/');
    await page.frameLocator(sel.iframe).locator(sel.decline).click();

    await expect(page.locator(sel.wrapper)).toBeHidden();
    const consent = await page.evaluate(() => localStorage.getItem('sp_consent'));
    expect(consent).toContain('"ConsentGiven":false');
  });

  test('consent persists across reload after accept', async ({ page }) => {
    await page.goto('/');
    await page.frameLocator(sel.iframe).locator(sel.accept).click();
    await expect(page.locator(sel.wrapper)).toBeHidden();

    await page.reload();
    await expect(page.locator(sel.wrapper)).toHaveCount(0);
  });

  test('consent persists across reload after decline', async ({ page }) => {
    await page.goto('/');
    await page.frameLocator(sel.iframe).locator(sel.decline).click();
    await expect(page.locator(sel.wrapper)).toBeHidden();

    await page.reload();
    await expect(page.locator(sel.wrapper)).toHaveCount(0);
  });
});
