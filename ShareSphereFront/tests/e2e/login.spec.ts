import { test, expect } from '@playwright/test';

// This test relies on the authenticated `storageState` produced by global-setup
test('authenticated session loads (uses saved storageState)', async ({ page }) => {
  await page.goto('/');

  // Expect app title / dashboard visible and an auth token present
  await expect(page.getByText('ShareSphere')).toBeVisible();
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
});
