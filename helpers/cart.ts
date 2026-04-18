import type { Page } from '@playwright/test';

export type CartSeedItem = { productId: string; quantity: number; size: string | null };

export async function seedCart(
  page: Page,
  items: CartSeedItem[],
  promoApplied: string | null = null,
): Promise<void> {
  await page.addInitScript(
    (payload) => {
      localStorage.setItem('ec_cart_v1', JSON.stringify(payload));
    },
    { items, promoApplied },
  );
}

export async function clearAppState(page: Page): Promise<void> {
  await page.addInitScript(() => {
    for (const key of ['ec_auth_v1', 'ec_cart_v1']) localStorage.removeItem(key);
    sessionStorage.removeItem('ec_session_token');
  });
}
