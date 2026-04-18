import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/cookie-banner';
import { loginViaStorage } from '../helpers/auth';
import { seedCart, type CartSeedItem } from '../helpers/cart';

const VALID_SHIP = {
  name: 'Ada Lovelace',
  address1: '221B Baker St',
  city: 'London',
  zip: 'NW1 6XE',
  country: 'UK',
};
const VALID_PAY = {
  name: 'Ada Lovelace',
  number: '4242 4242 4242 4242',
  expiry: '12/30',
  cvc: '123',
};

async function primeCheckout(
  page: import('@playwright/test').Page,
  items: CartSeedItem[] = [{ productId: 'p002', quantity: 1, size: 'M' }],
) {
  await loginViaStorage(page);
  await seedCart(page, items);
  await page.goto('/');
  await dismissCookieBanner(page);
  await page.goto('/checkout');
}

async function fillValidForm(page: import('@playwright/test').Page) {
  await page.getByTestId('ship-name').fill(VALID_SHIP.name);
  await page.getByTestId('ship-address1').fill(VALID_SHIP.address1);
  await page.getByTestId('ship-city').fill(VALID_SHIP.city);
  await page.getByTestId('ship-zip').fill(VALID_SHIP.zip);
  await page.getByTestId('ship-country').fill(VALID_SHIP.country);
  await page.getByTestId('pay-name').fill(VALID_PAY.name);
  await page.getByTestId('pay-number').fill(VALID_PAY.number);
  await page.getByTestId('pay-expiry').fill(VALID_PAY.expiry);
  await page.getByTestId('pay-cvc').fill(VALID_PAY.cvc);
}

test.describe('checkout', () => {
  test('happy path: fill valid shipping + card, place order, land on confirmation', async ({ page }) => {
    await primeCheckout(page);
    await fillValidForm(page);
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/\/checkout\/confirmation\/ORDER-\d{8}-[A-Z0-9]+/);
    await expect(page.getByRole('heading', { name: /Order placed/i })).toBeVisible();
    await expect(page.getByText(/ORDER-\d{8}-[A-Z0-9]+/)).toBeVisible();
    await expect(page.getByText('Navy Oxford Shirt (M) × 1')).toBeVisible();
    await expect(page.getByText('Total paid')).toBeVisible();
  });

  test('empty submit surfaces the first missing field (Full name is required)', async ({ page }) => {
    await primeCheckout(page);
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveText('Full name is required');
  });

  test('ZIP under 3 characters is rejected', async ({ page }) => {
    await primeCheckout(page);
    await fillValidForm(page);
    await page.getByTestId('ship-zip').fill('AB');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveText('Enter a valid ZIP / postal code');
  });

  test('invalid-Luhn card number is rejected', async ({ page }) => {
    await primeCheckout(page);
    await fillValidForm(page);
    await page.getByTestId('pay-number').fill('1234 5678 9012 3456');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveText('Card number is invalid');
  });

  test('expired card is rejected', async ({ page }) => {
    await primeCheckout(page);
    await fillValidForm(page);
    await page.getByTestId('pay-expiry').fill('01/20');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveText('Card has expired');
  });

  test('short CVC is rejected', async ({ page }) => {
    await primeCheckout(page);
    await fillValidForm(page);
    await page.getByTestId('pay-cvc').fill('1');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('checkout-error')).toHaveText('CVC must be 3 or 4 digits');
  });

  test('confirmation page renders order details', async ({ page }) => {
    await primeCheckout(page, [
      { productId: 'p002', quantity: 2, size: 'M' },
      { productId: 'p011', quantity: 1, size: null },
    ]);
    await fillValidForm(page);
    await page.getByTestId('place-order').click();

    await expect(page.getByRole('heading', { name: /Order placed/i })).toBeVisible();
    await expect(page.getByText('Navy Oxford Shirt (M) × 2')).toBeVisible();
    await expect(page.getByText('Heavy Canvas Tote Bag × 1')).toBeVisible();
    await expect(page.getByText('$144.00')).toBeVisible(); // 58*2 + 28
  });

  // Known bug (manual sweep 2026-04-17):
  // Out-of-stock items seeded into ec_cart_v1 (simulating tab-to-tab
  // cart drift, or a post-listing stock change) flow all the way
  // through to a completed order. Expected behavior: either the cart
  // page blocks OOS items, or checkout refuses them.
  // Marked test.fail() so the suite turns red when the fix lands.
  test.fail(
    'OOS item in the cart must not complete checkout [KNOWN BUG]',
    async ({ page }) => {
      await primeCheckout(page, [{ productId: 'p003', quantity: 1, size: '30' }]); // Selvedge (OOS)
      await fillValidForm(page);
      await page.getByTestId('place-order').click();

      await expect(page).not.toHaveURL(/\/checkout\/confirmation/);
    },
  );
});
