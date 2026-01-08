import { test, expect } from '@playwright/test';

// This test relies on the saved storageState produced by global-setup
test('session persistence uses saved storageState', async ({ page, context }) => {
  // config-level storageState should already be applied
  await page.goto('/');
  await expect(page.getByText('ShareSphere')).toBeVisible();

  // token present in localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();

  // New page in same context should also be authenticated
  const p2 = await context.newPage();
  await p2.goto('/');
  await expect(p2.getByText('ShareSphere')).toBeVisible();
});
