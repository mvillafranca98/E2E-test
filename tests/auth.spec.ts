import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/cookie-banner';
import { DEMO_USER, loginViaUI } from '../helpers/auth';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await dismissCookieBanner(page);
});

test.describe('login', () => {
  test('valid credentials redirect to home and authenticate', async ({ page }) => {
    await loginViaUI(page);
    await expect(page).toHaveURL('/');

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'My account' })).toBeVisible();
    await expect(page.getByText(DEMO_USER.name)).toBeVisible();
  });

  test('invalid password shows "Invalid email or password"', async ({ page }) => {
    await loginViaUI(page, DEMO_USER.email, 'WrongPassword1!');
    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('unknown email shows the same generic error', async ({ page }) => {
    await loginViaUI(page, 'nobody@example.com', DEMO_USER.password);
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('empty submit surfaces a form-level error', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Please correct the errors above');
  });
});

test.describe('register', () => {
  test('new email + strong password creates account and logs in', async ({ page }) => {
    const email = `qa-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.getByTestId('register-name').fill('QA Tester');
    await page.getByTestId('register-email').fill(email);
    await page.getByTestId('register-password').fill('Str0ngPass!');
    await page.getByTestId('register-confirm').fill('Str0ngPass!');
    await page.getByTestId('register-submit').click();

    await expect(page).toHaveURL('/');
    const auth = await page.evaluate(() => localStorage.getItem('ec_auth_v1'));
    expect(auth).toContain(email);
  });

  test('existing email shows "An account with that email already exists"', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('register-name').fill('Dup User');
    await page.getByTestId('register-email').fill(DEMO_USER.email);
    await page.getByTestId('register-password').fill('Str0ngPass!');
    await page.getByTestId('register-confirm').fill('Str0ngPass!');
    await page.getByTestId('register-submit').click();

    await expect(page.getByText('An account with that email already exists')).toBeVisible();
  });

  test('short password shows length error', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('register-name').fill('QA');
    await page.getByTestId('register-email').fill(`short-${Date.now()}@example.com`);
    await page.getByTestId('register-password').fill('Ab1!');
    await page.getByTestId('register-confirm').fill('Ab1!');
    await page.getByTestId('register-submit').click();

    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('password without uppercase shows uppercase error', async ({ page }) => {
    await page.goto('/register');
    await page.getByTestId('register-name').fill('QA');
    await page.getByTestId('register-email').fill(`nocase-${Date.now()}@example.com`);
    await page.getByTestId('register-password').fill('lowercase1!');
    await page.getByTestId('register-confirm').fill('lowercase1!');
    await page.getByTestId('register-submit').click();

    await expect(page.getByText('Password must contain an uppercase letter')).toBeVisible();
  });
});

test.describe('logout', () => {
  test('clears auth state and redirects to login', async ({ page }) => {
    await loginViaUI(page);
    await page.goto('/account');

    await page.getByTestId('account-logout').click();
    await expect(page).toHaveURL(/\/login/);

    const auth = await page.evaluate(() => localStorage.getItem('ec_auth_v1'));
    expect(auth === null || auth === 'null').toBe(true);
  });

  // Known bug (flagged during manual sweep 2026-04-17):
  // logout clears ec_auth_v1 in localStorage but leaves ec_session_token
  // behind in sessionStorage. Expected behavior is that BOTH are cleared.
  // Marked as test.fail() so the suite goes red the day this is fixed.
  test.fail(
    'logout should also clear ec_session_token in sessionStorage [KNOWN BUG]',
    async ({ page }) => {
      await loginViaUI(page);
      await page.goto('/account');
      await page.getByTestId('account-logout').click();
      await expect(page).toHaveURL(/\/login/);

      const token = await page.evaluate(() => sessionStorage.getItem('ec_session_token'));
      expect(token).toBeNull();
    },
  );
});

test.describe('protected routes', () => {
  test('/account unauthenticated redirects to login with redirect param', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL('/login?redirect=%2Faccount');
    await expect(page.getByTestId('login-email')).toBeVisible();
  });

  test('/checkout unauthenticated redirects to login with redirect param', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL('/login?redirect=%2Fcheckout');
  });

  test('login preserves the redirect destination', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL('/login?redirect=%2Faccount');

    await page.getByTestId('login-email').fill(DEMO_USER.email);
    await page.getByTestId('login-password').fill(DEMO_USER.password);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/account');
  });
});
