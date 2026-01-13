import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Credentials: default seeded user
declare const process: { env: { [key: string]: string | undefined } };
const TEST_USER = {
  username: process.env.E2E_USER_USERNAME || 'jsmith',
  password: process.env.E2E_USER_PASSWORD || 'User123!'
};

// Backend API base (used for verification)
const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5133';

test('buy trade via UI updates backend trades', async ({ page, request }) => {
  // Use saved authenticated storageState (global-setup)
  await page.goto('/');

  // Get auth token from storageState-localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Determine shareholderId from saved user in localStorage
  const userJson = await page.evaluate(() => localStorage.getItem('user'));
  const user = userJson ? JSON.parse(userJson) : null;
  const shareholderId = user?.shareholderId;
  expect(shareholderId).toBeTruthy();

  // Get initial portfolio for later verification
  const beforePortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(beforePortfolioRes.ok()).toBeTruthy();
  const beforePortfolio = await beforePortfolioRes.json();

  // 3) Get initial trades count
  const beforeRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(beforeRes.ok()).toBeTruthy();
  const beforeTrades = await beforeRes.json();
  const beforeCount = Array.isArray(beforeTrades) ? beforeTrades.length : 0;

  // 4) Navigate to trade page
  await page.goto('/trade');

  // Wait for select elements to be available
  await page.locator('#broker').waitFor({ state: 'visible' });
  await page.locator('#share').waitFor({ state: 'visible' });

  // 5) Select first available broker and share (skip first placeholder option)
  const brokerOption = await page.locator('#broker option:not(:first-child)').first();
  const brokerValue = await brokerOption.getAttribute('value');
  expect(brokerValue).toBeTruthy();
  await page.selectOption('#broker', brokerValue as string);

  const shareOption = await page.locator('#share option:not(:first-child)').first();
  const shareValue = await shareOption.getAttribute('value');
  expect(shareValue).toBeTruthy();
  await page.selectOption('#share', shareValue as string);

  // 6) Enter quantity and submit (use 1)
  await page.fill('#quantity', '1');
  await page.locator('button[type="submit"]').click();

  // 7) Expect confirmation UI
  await expect(page.getByText('Trade Executed Successfully')).toBeVisible({ timeout: 10000 });

  // 8) Verify backend has one more trade
  const afterRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(afterRes.ok()).toBeTruthy();
  const afterTrades = await afterRes.json();
  const afterCount = Array.isArray(afterTrades) ? afterTrades.length : 0;

  expect(afterCount).toBeGreaterThan(beforeCount);

  // Optionally assert the most recent trade matches quantity 1
  const newest = afterTrades.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  expect(newest).toBeTruthy();
  expect(newest.quantity).toBeGreaterThanOrEqual(1);

  // Verify portfolio updated for the traded share (poll backend until updated)
  const shareId = parseInt(shareValue as string);
  const beforeOwnedArray = Array.isArray(beforePortfolio.ownedShares)
    ? beforePortfolio.ownedShares
    : Array.isArray(beforePortfolio.OwnedShares)
    ? beforePortfolio.OwnedShares
    : [];

  const beforeOwned = beforeOwnedArray.find((s: any) => (s.shareId ?? s.ShareId) === shareId);
  const beforeQty = (beforeOwned && ((beforeOwned.quantity ?? beforeOwned.Quantity) || 0)) || 0;

  let afterQty = 0;
  let afterPortfolio: any = null;
  const maxRetries = 12;
  for (let i = 0; i < maxRetries; i++) {
    const res = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
    if (!res.ok()) {
      await new Promise(r => setTimeout(r, 500));
      continue;
    }
    afterPortfolio = await res.json();
    const afterOwnedArray = Array.isArray(afterPortfolio.ownedShares)
      ? afterPortfolio.ownedShares
      : Array.isArray(afterPortfolio.OwnedShares)
      ? afterPortfolio.OwnedShares
      : [];
    const afterOwned = afterOwnedArray.find((s: any) => (s.shareId ?? s.ShareId) === shareId);
    afterQty = (afterOwned && ((afterOwned.quantity ?? afterOwned.Quantity) || 0)) || 0;
    if (afterQty >= beforeQty + 1) break;
    await new Promise(r => setTimeout(r, 500));
  }

  if (afterQty < beforeQty + 1) {
    try {
      const out = path.join(process.cwd(), 'test-results', test.info().title.replace(/\s+/g, '-').slice(0,40) + `-portfolio-debug-${Date.now()}.json`);
      await fs.promises.mkdir(path.dirname(out), { recursive: true });
      await fs.promises.writeFile(out, JSON.stringify({ beforePortfolio, afterPortfolio }, null, 2));
      console.log('Saved portfolio debug JSON to', out);
    } catch (err) {
      console.error('Failed to write portfolio debug JSON:', err);
    }
  }

  expect(afterQty).toBeGreaterThanOrEqual(beforeQty + 1);
});
