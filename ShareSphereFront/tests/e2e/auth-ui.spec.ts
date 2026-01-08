import { test, expect } from '@playwright/test';

// Run this file without the saved storageState so we can exercise the UI login flow
test.use({ storageState: undefined });

const USERNAME = process.env.E2E_USER_USERNAME || process.env.E2E_USER_EMAIL || 'jsmith';
const PASSWORD = process.env.E2E_USER_PASSWORD || 'User123!';

test('valid login with test user redirects to dashboard', async ({ page }) => {
  // Ensure no auth state or cookies remain in this test's context
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  await page.goto('/login');

  // Wait for the Username input to appear (handle slow loads or redirects)
  const usernameInput = page.locator('input[placeholder="Username"]');
  await usernameInput.waitFor({ state: 'visible', timeout: 10_000 });
  await usernameInput.fill(USERNAME);

  const passwordInput = page.locator('input[placeholder="Password"]');
  await passwordInput.fill(PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();

  // Wait for redirect to root/dashboard
  await page.waitForURL('**/');
  await expect(page.getByText('ShareSphere')).toBeVisible();

  // token should be stored in localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
});
