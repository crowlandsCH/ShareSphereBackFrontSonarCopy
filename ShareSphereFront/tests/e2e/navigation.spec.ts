import { test, expect } from '@playwright/test';

// Relies on saved authenticated storageState from global-setup
test('navigate Dashboard → Exchanges → Companies → Trade and check UI elements', async ({ page }) => {
  // 1) Start at dashboard
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const header = page.getByText('Stock Exchanges');
  await header.waitFor({ state: 'visible', timeout: 15_000 });

  // 2) Click first exchange card
  const exchangeBtn = page.locator('button[aria-label^="View companies on"]').first();
  await exchangeBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await exchangeBtn.click();

  // 3) Expect company list table and click first company row
  const companyRow = page.locator('tr[role="button"]').first();
  await companyRow.waitFor({ state: 'visible', timeout: 10_000 });
  await companyRow.click();

  // 4) Expect shares table with Trade button(s)
  const tradeBtn = page.getByRole('button', { name: 'Trade' }).first();
  await tradeBtn.waitFor({ state: 'visible', timeout: 10_000 });

  // Check price and available quantity are present in the row
  const priceCell = page.locator('table tbody tr').first().locator('td').nth(1);
  const qtyCell = page.locator('table tbody tr').first().locator('td').nth(2);
  await expect(priceCell).toBeVisible();
  await expect(qtyCell).toBeVisible();

  // 5) Click Trade and verify Trade page loads with expected inputs
  await tradeBtn.click();
  await expect(page).toHaveURL(/\/trade/);

  // Form elements should be present
  await expect(page.locator('#broker')).toBeVisible();
  await expect(page.locator('#share')).toBeVisible();
  await expect(page.locator('#quantity')).toBeVisible();
});
