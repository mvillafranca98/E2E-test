import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/cookie-banner';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await dismissCookieBanner(page);
});

test.describe('product detail page', () => {
  test('renders name, price, description and an in-stock add-to-cart', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');

    await expect(page.getByRole('heading', { name: 'Navy Oxford Shirt' })).toBeVisible();
    await expect(page.getByTestId('product-description')).toContainText('Button-down collar');
    await expect(page.getByTestId('stock-badge').first()).toHaveAttribute('data-stock', 'in');

    const add = page.getByTestId('add-to-cart');
    await expect(add).toBeEnabled();
    await expect(add).toHaveText('Add to cart');
  });

  test('out-of-stock product shows disabled "Out of stock" button', async ({ page }) => {
    await page.goto('/products/selvedge-denim-jeans');

    await expect(page.getByRole('heading', { name: 'Selvedge Denim Jeans' })).toBeVisible();
    await expect(page.getByTestId('stock-badge').first()).toHaveAttribute('data-stock', 'out');

    const add = page.getByTestId('add-to-cart');
    await expect(add).toBeDisabled();
    await expect(add).toHaveText('Out of stock');
  });

  test('size selection toggles data-selected on the chosen pill', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');

    await page.getByTestId('size-option-M').click();
    await expect(page.getByTestId('size-option-M')).toHaveAttribute('data-selected', 'true');
    await expect(page.getByTestId('size-option-L')).not.toHaveAttribute('data-selected', 'true');
  });

  test('picking a size then adding writes the correct line to ec_cart_v1', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');

    await page.getByTestId('size-option-L').click();
    await page.getByTestId('add-to-cart').click();

    await expect(page.getByTestId('cart-button')).toContainText('1');
    const cart = await page.evaluate(() => localStorage.getItem('ec_cart_v1'));
    const parsed = JSON.parse(cart ?? '{}');
    expect(parsed.items).toEqual([
      expect.objectContaining({ productId: 'p002', quantity: 1, size: 'L' }),
    ]);
  });

  test('invalid product slug shows "Product not found"', async ({ page }) => {
    await page.goto('/products/this-does-not-exist');
    await expect(page.getByText('Product not found')).toBeVisible();
    await expect(page.getByRole('link', { name: /back to shop/i })).toBeVisible();
  });

  test('add-to-cart without a size shows "Please select a size" and does not add', async ({ page }) => {
    await page.goto('/products/navy-oxford-shirt');
    await page.getByTestId('add-to-cart').click();

    await expect(page.getByText('Please select a size')).toBeVisible();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('ec_cart_v1') ?? '{}'));
    expect(cart.items ?? []).toHaveLength(0);
  });
});
