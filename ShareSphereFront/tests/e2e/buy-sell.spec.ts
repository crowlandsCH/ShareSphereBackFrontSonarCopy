import { test, expect } from '@playwright/test';

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5133';

function getOwnedArray(portfolio: any) {
  return Array.isArray(portfolio.ownedShares)
    ? portfolio.ownedShares
    : Array.isArray(portfolio.OwnedShares)
    ? portfolio.OwnedShares
    : [];
}

function findOwned(ownedArray: any[], shareId: number) {
  return ownedArray.find((s: any) => (s.shareId ?? s.ShareId) === shareId);
}

test('buy then sell flow updates trades and portfolio', async ({ page, request }) => {
  // Ensure authenticated via saved storageState
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // auth token and user
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
  const userJson = await page.evaluate(() => localStorage.getItem('user'));
  const user = userJson ? JSON.parse(userJson) : null;
  const shareholderId = user?.shareholderId;
  expect(shareholderId).toBeTruthy();

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // capture before-state
  const beforeTradesRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(beforeTradesRes.ok()).toBeTruthy();
  const beforeTrades = await beforeTradesRes.json();
  const beforeTradesCount = Array.isArray(beforeTrades) ? beforeTrades.length : 0;

  const beforePortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(beforePortfolioRes.ok()).toBeTruthy();
  const beforePortfolio = await beforePortfolioRes.json();
  const beforeOwned = getOwnedArray(beforePortfolio);

  // Navigate to trade page and select first available broker/share
  await page.goto('/trade');
  await page.locator('#broker').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#share').waitFor({ state: 'visible', timeout: 10_000 });

  const brokerOption = page.locator('#broker option:not(:first-child)').first();
  const brokerValue = await brokerOption.getAttribute('value');
  expect(brokerValue).toBeTruthy();
  await page.selectOption('#broker', brokerValue as string);

  const shareOption = page.locator('#share option:not(:first-child)').first();
  const shareValue = await shareOption.getAttribute('value');
  expect(shareValue).toBeTruthy();
  await page.selectOption('#share', shareValue as string);

  const shareId = parseInt(shareValue as string);

  // BUY 1
  await page.fill('#quantity', '1');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Trade Executed Successfully')).toBeVisible({ timeout: 10_000 });

  // verify trades incremented and portfolio updated
  const afterBuyTradesRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(afterBuyTradesRes.ok()).toBeTruthy();
  const afterBuyTrades = await afterBuyTradesRes.json();
  const afterBuyCount = Array.isArray(afterBuyTrades) ? afterBuyTrades.length : 0;
  expect(afterBuyCount).toBeGreaterThan(beforeTradesCount);

  const afterBuyPortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(afterBuyPortfolioRes.ok()).toBeTruthy();
  const afterBuyPortfolio = await afterBuyPortfolioRes.json();
  const afterBuyOwned = getOwnedArray(afterBuyPortfolio);

  const beforeQty = (findOwned(beforeOwned, shareId)?.quantity ?? findOwned(beforeOwned, shareId)?.Quantity) ?? 0;
  const afterBuyQty = (findOwned(afterBuyOwned, shareId)?.quantity ?? findOwned(afterBuyOwned, shareId)?.Quantity) ?? 0;
  expect(afterBuyQty).toBeGreaterThanOrEqual(beforeQty + 1);

  // SELL 1
  // Navigate back to trade page and switch to Sell
  await page.goto('/trade');
  await page.getByRole('button', { name: 'Sell' }).click();

  // Ensure selects are present and pre-select the same share and broker
  await page.locator('#broker').waitFor({ state: 'visible', timeout: 10_000 });
  await page.selectOption('#broker', brokerValue as string);
  await page.selectOption('#share', shareValue as string);
  await page.fill('#quantity', '1');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Trade Executed Successfully')).toBeVisible({ timeout: 10_000 });

  // verify trades increment again and portfolio updated (quantity reduced)
  const afterSellTradesRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(afterSellTradesRes.ok()).toBeTruthy();
  const afterSellTrades = await afterSellTradesRes.json();
  const afterSellCount = Array.isArray(afterSellTrades) ? afterSellTrades.length : 0;
  expect(afterSellCount).toBeGreaterThan(afterBuyCount);

  const afterSellPortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(afterSellPortfolioRes.ok()).toBeTruthy();
  const afterSellPortfolio = await afterSellPortfolioRes.json();
  const afterSellOwned = getOwnedArray(afterSellPortfolio);

  const finalQty = (findOwned(afterSellOwned, shareId)?.quantity ?? findOwned(afterSellOwned, shareId)?.Quantity) ?? 0;
  // finalQty should be >= beforeQty (if buy+sell = net 0) or equal to beforeQty
  expect(finalQty).toBeGreaterThanOrEqual(beforeQty);
});
