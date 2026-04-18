import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/cookie-banner';
import { seedCart } from '../helpers/cart';

// Every cart line and promo element appears twice on /cart because the
// drawer is always mounted. Scope locators to the cart page's <main>.
const main = (page: import('@playwright/test').Page) => page.locator('main');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await dismissCookieBanner(page);
});

test.describe('cart', () => {
  test('empty cart shows empty-state copy and continue-shopping link', async ({ page }) => {
    await page.goto('/cart');
    await expect(main(page).getByText('Your cart is empty.')).toBeVisible();
    await expect(main(page).getByRole('link', { name: /continue shopping/i })).toBeVisible();
  });

  test('adding same product + same size increments quantity (no new line)', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');
    await page.getByTestId('size-option-M').click();
    await page.getByTestId('add-to-cart').click();
    await page.getByTestId('add-to-cart').click();

    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('ec_cart_v1') ?? '{}'));
    expect(cart.items).toEqual([
      expect.objectContaining({ productId: 'p002', quantity: 2, size: 'M' }),
    ]);
  });

  test('adding same product + different size creates a new line', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');
    await page.getByTestId('size-option-M').click();
    await page.getByTestId('add-to-cart').click();

    await page.getByTestId('size-option-L').click();
    await page.getByTestId('add-to-cart').click();

    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('ec_cart_v1') ?? '{}'));
    expect(cart.items).toHaveLength(2);
    expect(cart.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: 'p002', size: 'M', quantity: 1 }),
        expect.objectContaining({ productId: 'p002', size: 'L', quantity: 1 }),
      ]),
    );
  });

  test('incrementing qty updates subtotal', async ({ page }) => {
    await seedCart(page, [{ productId: 'p011', quantity: 1, size: null }]);
    await page.goto('/cart');

    await expect(main(page).getByText('$28.00').first()).toBeVisible();

    await main(page).getByTestId('cart-line-canvas-tote-bag-qty-increment').click();
    await expect(main(page).getByText('$56.00').first()).toBeVisible();
  });

  test('decrement at qty=1 is disabled — users must click Remove to empty the line', async ({ page }) => {
    await seedCart(page, [{ productId: 'p011', quantity: 1, size: null }]);
    await page.goto('/cart');

    const dec = main(page).getByTestId('cart-line-canvas-tote-bag-qty-decrement');
    await expect(dec).toBeDisabled();

    await main(page).getByTestId('cart-line-remove-canvas-tote-bag').click();
    await expect(main(page).getByText('Your cart is empty.')).toBeVisible();
  });

  test('explicit Remove drops the line item', async ({ page }) => {
    await seedCart(page, [
      { productId: 'p002', quantity: 1, size: 'M' },
      { productId: 'p011', quantity: 1, size: null },
    ]);
    await page.goto('/cart');

    await main(page).getByTestId('cart-line-remove-navy-oxford-shirt').click();
    await expect(main(page).getByText('Navy Oxford Shirt')).toHaveCount(0);
    await expect(main(page).getByText('Heavy Canvas Tote Bag')).toBeVisible();
  });
});

test.describe('promo code', () => {
  test('WELCOME10 applies 10% off the subtotal', async ({ page }) => {
    await seedCart(page, [
      { productId: 'p002', quantity: 1, size: 'M' },
      { productId: 'p011', quantity: 1, size: null },
    ]);
    await page.goto('/cart');

    await main(page).getByTestId('promo-input').fill('WELCOME10');
    await main(page).getByTestId('promo-apply').click();

    await expect(main(page).getByText('WELCOME10 applied')).toBeVisible();
    await expect(main(page).getByText('−$8.60')).toBeVisible();
    await expect(main(page).getByText('$77.40')).toBeVisible();
  });

  test('invalid code shows "Invalid promo code"', async ({ page }) => {
    await seedCart(page, [{ productId: 'p011', quantity: 1, size: null }]);
    await page.goto('/cart');

    await main(page).getByTestId('promo-input').fill('FAKE99');
    await main(page).getByTestId('promo-apply').click();

    await expect(main(page).getByText('Invalid promo code')).toBeVisible();
  });

  test('removing + reapplying WELCOME10 shows "Code already used this session"', async ({ page }) => {
    await seedCart(page, [{ productId: 'p011', quantity: 1, size: null }]);
    await page.goto('/cart');

    await main(page).getByTestId('promo-input').fill('WELCOME10');
    await main(page).getByTestId('promo-apply').click();
    await expect(main(page).getByText('WELCOME10 applied')).toBeVisible();

    await main(page).getByTestId('promo-remove').click();
    await main(page).getByTestId('promo-input').fill('WELCOME10');
    await main(page).getByTestId('promo-apply').click();

    await expect(main(page).getByText('Code already used this session')).toBeVisible();
  });

  // Known UX bug (manual sweep 2026-04-17): "Invalid promo code" stays
  // visible after unrelated cart actions (remove line, qty change).
  // Expected behavior: error clears on the next cart mutation.
  test.fail(
    'stale "Invalid promo code" should clear after unrelated cart actions [KNOWN BUG]',
    async ({ page }) => {
      await seedCart(page, [
        { productId: 'p002', quantity: 1, size: 'M' },
        { productId: 'p011', quantity: 1, size: null },
      ]);
      await page.goto('/cart');

      await main(page).getByTestId('promo-input').fill('FAKE99');
      await main(page).getByTestId('promo-apply').click();
      await expect(main(page).getByText('Invalid promo code')).toBeVisible();

      await main(page).getByTestId('cart-line-remove-navy-oxford-shirt').click();
      await expect(main(page).getByText('Invalid promo code')).toHaveCount(0);
    },
  );
});

test.describe('shipping thresholds', () => {
  test('orders over $50 ship free with an unlocked message', async ({ page }) => {
    await seedCart(page, [{ productId: 'p002', quantity: 1, size: 'M' }]); // $58
    await page.goto('/cart');

    await expect(main(page).getByTestId('free-shipping-unlocked')).toBeVisible();
    await expect(main(page).getByTestId('summary-shipping')).toContainText(/^Shipping\s*Free$/);
  });

  test('orders under $50 show the $5.99 shipping fee and remaining-to-unlock message', async ({ page }) => {
    await seedCart(page, [{ productId: 'p011', quantity: 1, size: null }]); // $28
    await page.goto('/cart');

    await expect(main(page).getByText('$5.99')).toBeVisible();
    await expect(main(page).getByText(/Add \$22\.00 more for free shipping/)).toBeVisible();
  });
});
