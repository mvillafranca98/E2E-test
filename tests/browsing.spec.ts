import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/cookie-banner';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await dismissCookieBanner(page);
});

test.describe('product listing', () => {
  test('homepage renders featured products', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Featured products' })).toBeVisible();
    await expect(page.locator('main article')).not.toHaveCount(0);
  });

  test('/products shows all 16 products', async ({ page }) => {
    await page.goto('/products');
    await expect(page.getByText('16 products')).toBeVisible();
  });

  test('filter by "Men\'s Apparel" narrows to the 4 men\'s items', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('category-chip-apparel-mens').click();

    await expect(page.getByText('4 products')).toBeVisible();
    const articles = page.locator('main article');
    await expect(articles).toHaveCount(4);
    await expect(articles.filter({ hasText: 'Selvedge Denim Jeans' })).toHaveCount(1);
    await expect(articles.filter({ hasText: 'Navy Oxford Shirt' })).toHaveCount(1);
    await expect(articles.filter({ hasText: 'Merino Wool Sweater' })).toHaveCount(1);
    // Classic White Tee appears in both men's (p001) and women's (p005);
    // here we expect exactly one (the men's one).
    await expect(articles.filter({ hasText: 'Classic White Tee' })).toHaveCount(1);
  });

  test('clicking "All" clears the category filter', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('category-chip-accessories').click();
    await expect(page.getByText(/\d+ products/)).toContainText('4 products');

    await page.getByTestId('category-chip-all').click();
    await expect(page.getByText('16 products')).toBeVisible();
  });
});

test.describe('sorting', () => {
  test('price low-to-high puts cheapest first ($22)', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('sort-select').selectOption('price-asc');

    const first = page.locator('main article').first();
    await expect(first).toContainText('$22.00');
  });

  test('price high-to-low puts Cashmere Cardigan ($165) first', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('sort-select').selectOption('price-desc');

    const first = page.locator('main article').first();
    await expect(first).toContainText('Cashmere Cardigan');
    await expect(first).toContainText('$165.00');
  });

  test('name A→Z puts Cashmere Cardigan first', async ({ page }) => {
    await page.goto('/products');
    await page.getByTestId('sort-select').selectOption('name-asc');

    const first = page.locator('main article').first();
    await expect(first).toContainText('Cashmere Cardigan');
  });
});

test.describe('search', () => {
  test('searching "kettle" returns exactly one result', async ({ page }) => {
    await page.goto('/products');
    await page.locator('#search-input').fill('kettle');

    await expect(page.getByText('1 product', { exact: true })).toBeVisible();
    await expect(page.locator('main article')).toHaveCount(1);
    await expect(page.locator('main article').first()).toContainText('Enamel Pour-Over Kettle');
  });

  test('searching a nonexistent term shows the empty state', async ({ page }) => {
    await page.goto('/products');
    await page.locator('#search-input').fill('zzxxxnoresult');

    await expect(page.getByText('0 products')).toBeVisible();
    await expect(page.getByText('No products match your filters.')).toBeVisible();
  });

  test('clearing the search restores all 16 products', async ({ page }) => {
    await page.goto('/products');
    const search = page.locator('#search-input');

    await search.fill('kettle');
    await expect(page.getByText('1 product', { exact: true })).toBeVisible();

    await search.fill('');
    await expect(page.getByText('16 products')).toBeVisible();
  });
});
