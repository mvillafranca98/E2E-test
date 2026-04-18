import type { Page } from '@playwright/test';

export const DEMO_USER = {
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test Customer',
};

export async function loginViaUI(
  page: Page,
  email: string = DEMO_USER.email,
  password: string = DEMO_USER.password,
): Promise<void> {
  await page.goto('/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

export async function loginViaStorage(page: Page, user = DEMO_USER): Promise<void> {
  const fakeToken = buildFakeJwt(user.email, user.name);
  await page.addInitScript(
    ({ email, name, token }) => {
      localStorage.setItem('ec_auth_v1', JSON.stringify({ user: { email, name }, token }));
      sessionStorage.setItem('ec_session_token', token);
    },
    { email: user.email, name: user.name, token: fakeToken },
  );
}

function buildFakeJwt(email: string, name: string): string {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({ sub: email, name, iat: now, exp: now + 24 * 60 * 60 }),
  );
  return `${header}.${payload}.fake-signature`;
}

function base64url(input: string): string {
  return Buffer.from(input).toString('base64');
}
