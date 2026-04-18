import { expect, type Page } from '@playwright/test';

const BANNER_WRAPPER = '#main-cookie-banner';
const BANNER_IFRAME = '#ifrmCookieBanner';
const ACCEPT_BTN = '#sp-accept';
const DECLINE_BTN = '#sp-decline';

export const cookieBannerSelectors = {
  wrapper: BANNER_WRAPPER,
  iframe: BANNER_IFRAME,
  accept: ACCEPT_BTN,
  decline: DECLINE_BTN,
};

export async function dismissCookieBanner(
  page: Page,
  action: 'accept' | 'decline' = 'accept',
  timeoutMs = 4_000,
): Promise<'dismissed' | 'not-shown'> {
  const button = page
    .frameLocator(BANNER_IFRAME)
    .locator(action === 'accept' ? ACCEPT_BTN : DECLINE_BTN);
  try {
    await button.waitFor({ state: 'visible', timeout: timeoutMs });
  } catch {
    return 'not-shown';
  }
  await button.click();
  await expect(page.locator(BANNER_WRAPPER)).toBeHidden();
  return 'dismissed';
}
