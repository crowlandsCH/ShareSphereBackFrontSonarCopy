import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const API_BASE = process.env.PLAYWRIGHT_API_BASE_URL || 'http://localhost:5133';

function parseCurrency(text: string) {
  // Removes non-numeric except dot and minus
  const cleaned = text.replace(/[^0-9.-]+/g, '');
  return Number(cleaned);
}

function parseInteger(text: string) {
  return Number(text.replace(/[^0-9-]+/g, ''));
}

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

// Tests: buy 1 share -> verify portfolio UI holdings & (if present) available cash/summary -> verify TradeHistory UI row -> verify backend trade record.
// Then sell 1 share and re-verify.

test('post-trade verification: portfolio UI and transaction history reflect buy and sell', async ({ page, request }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  expect(token).toBeTruthy();
  const userJson = await page.evaluate(() => localStorage.getItem('user'));
  const user = userJson ? JSON.parse(userJson) : null;
  const shareholderId = user?.shareholderId;
  expect(shareholderId).toBeTruthy();

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Fetch portfolio before
  const beforePortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(beforePortfolioRes.ok()).toBeTruthy();
  const beforePortfolio = await beforePortfolioRes.json();
  const beforeOwned = getOwnedArray(beforePortfolio);
  const beforeSummaryValue = (beforePortfolio.totalPortfolioValue ?? beforePortfolio.PortfolioValue ?? 0) as number;
  const beforeQtyForShare = (id: number) => (findOwned(beforeOwned, id)?.quantity ?? findOwned(beforeOwned, id)?.Quantity) ?? 0;

  // Navigate to trade and pick first broker + share (Buy)
  await page.goto('/trade');
  await page.locator('#broker').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('#share').waitFor({ state: 'visible', timeout: 10_000 });

  const brokerOption = page.locator('#broker option:not(:first-child)').first();
  const brokerValue = await brokerOption.getAttribute('value');
  expect(brokerValue).toBeTruthy();
  await page.selectOption('#broker', brokerValue as string);

  const shareOption = page.locator('#share option:not(:first-child)').first();
  const shareValue = await shareOption.getAttribute('value');
  const shareText = await shareOption.textContent();
  expect(shareValue).toBeTruthy();
  expect(shareText).toBeTruthy();
  await page.selectOption('#share', shareValue as string);

  // Parse company name and unit price from option text like: "Acme (ACM) - $12.34 - (100 Available)"
  const companyName = (shareText || '').split('(')[0].trim();
  const priceMatch = (shareText || '').match(/\$[0-9,]+(?:\.[0-9]{1,2})?/);
  const unitPrice = priceMatch ? parseCurrency(priceMatch[0]) : null;
  const shareId = parseInt(shareValue as string, 10);
  expect(companyName).toBeTruthy();
  expect(unitPrice).not.toBeNull();

  // BUY 1
  await page.fill('#quantity', '1');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('Trade Executed Successfully')).toBeVisible({ timeout: 10_000 });

  // Wait for redirect to portfolio (TradeForm navigates after success)
  await page.waitForURL('**/portfolio', { timeout: 10_000 });
  await page.waitForLoadState('networkidle');
  // Backend: fetch portfolio after buy and assert backend reflects the purchase
  const afterPortfolioRes = await request.get(`${API_BASE}/api/shareholders/${shareholderId}/portfolio`, { headers: authHeaders });
  expect(afterPortfolioRes.ok()).toBeTruthy();
  const afterPortfolio = await afterPortfolioRes.json();
  const afterOwned = getOwnedArray(afterPortfolio);
  const backendQty = (findOwned(afterOwned, shareId)?.quantity ?? findOwned(afterOwned, shareId)?.Quantity) ?? 0;

  const beforeQty = beforeQtyForShare(shareId);
  expect(backendQty).toBeGreaterThanOrEqual(beforeQty + 1);

  // UI: Holdings table should contain the company row and quantity incremented by 1 — retry/reload if needed
  const holdingsSelector = 'table >> text=' + companyName;
  let holdingsRow = page.locator(holdingsSelector).first();
  await expect(holdingsRow).toBeVisible({ timeout: 10_000 });

  const row = holdingsRow.locator('xpath=ancestor::tr');
  const qtyCell = row.locator('td').nth(1); // second column is Quantity per HoldingsTable
  let qtyText = await qtyCell.textContent();
  let shownQty = parseInteger(qtyText || '0');

  // retry UI read (reload) a few times if it hasn't updated yet
  for (let i = 0; i < 6 && shownQty < beforeQty + 1; i++) {
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForLoadState('networkidle');
    holdingsRow = page.locator(holdingsSelector).first();
    await holdingsRow.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const rowRetry = holdingsRow.locator('xpath=ancestor::tr');
    qtyText = await rowRetry.locator('td').nth(1).textContent();
    shownQty = parseInteger(qtyText || '0');
  }

  expect(shownQty).toBeGreaterThanOrEqual(beforeQty + 1);

  // UI: if portfolio summary shows total portfolio value, ensure it updated (non-strict check)
  const summaryValueLocator = page.locator('text=Total Portfolio Value').first();
  if (await summaryValueLocator.count() > 0) {
    const valEl = summaryValueLocator.locator('xpath=following::div[1]').first();
    const valText = (await valEl.textContent()) || '';
    const shownSummary = parseCurrency(valText || '0');
    // total portfolio value should be a number (not NaN)
    expect(Number.isFinite(shownSummary)).toBeTruthy();
  }

  // UI: Trade History should show the latest Buy for the company with correct fields
  const tradeTable = page.locator('text=Trade History').locator('xpath=following::table[1]');
  await tradeTable.waitFor({ state: 'visible', timeout: 15_000 });
  const tradeRow = tradeTable.locator('tbody tr').filter({ hasText: companyName }).filter({ hasText: 'Buy' }).first();
  await expect(tradeRow).toBeVisible({ timeout: 15_000 });

  // Within that trade row, check quantity and price cells
  // `tradeRow` is already the <tr> element; ensure it has enough cells and retry if needed
  await tradeRow.waitFor({ state: 'visible', timeout: 15_000 });
  const cells = tradeRow.locator('td');
  let cellCount = await cells.count();
  for (let i = 0; i < 10 && cellCount < 4; i++) {
    await page.waitForTimeout(300);
    cellCount = await cells.count();
  }
  if (cellCount < 4) {
    throw new Error('Trade row does not contain expected number of columns');
  }
  const tradeQtyText = await cells.nth(2).textContent(); // 3rd column quantity
  const tradePriceText = await cells.nth(3).textContent(); // 4th column unit price
  expect(parseInteger(tradeQtyText || '0')).toBeGreaterThanOrEqual(1);
  const uiUnitPrice = parseCurrency(tradePriceText || '0');
  // Allow small rounding differences
  expect(Math.abs(uiUnitPrice - (unitPrice ?? 0))).toBeLessThan(0.5);

  // Backend: verify a matching trade exists
  const tradesRes = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(tradesRes.ok()).toBeTruthy();
  const trades = await tradesRes.json();
  expect(Array.isArray(trades)).toBeTruthy();

  // Find trade that matches companyName (backend returns CompanyName) and quantity=1 and type Buy
  const foundTrade = trades.find((t: any) => {
    const companyField = (t.companyName ?? t.CompanyName ?? t.company?.name ?? t.Company?.Name ?? '');
    const companyMatch = companyField.toString().trim() === companyName;
    const qty = (t.quantity ?? t.Quantity) ?? (t.Quantity ?? t.Quantity);
    const typeVal = t.type ?? t.Type;
    const isBuy = typeVal === 0 || typeVal === 'Buy' || typeVal === 'buy';
    return companyMatch && qty === 1 && isBuy;
  });
  if (!foundTrade) {
    try {
      const out = test.info().outputPath(`trades-my-trades-after-buy-${Date.now()}.json`);
      await fs.promises.mkdir(path.dirname(out), { recursive: true });
      await fs.promises.writeFile(out, JSON.stringify(trades, null, 2));
      console.log('Saved trades JSON to', out);
    } catch (err) {
      console.error('Failed to write trades JSON:', err);
    }
  }

  expect(foundTrade).toBeTruthy();
  if (foundTrade) {
    // Check important fields
    expect(foundTrade.unitPrice ?? foundTrade.unitPricePerShare ?? foundTrade.price).toBeTruthy();
    const backendPrice = Number(foundTrade.unitPrice ?? foundTrade.unitPricePerShare ?? foundTrade.price);
    // allow small rounding differences
    expect(Math.abs(backendPrice - (unitPrice ?? 0))).toBeLessThan(1);
    expect(foundTrade.brokerId ?? foundTrade.BrokerId).toBeTruthy();
    expect(foundTrade.timestamp ?? foundTrade.date ?? foundTrade.createdAt).toBeTruthy();
  }

  // SELL 1 (return to trade and select Sell)
  await page.goto('/trade');
  await page.getByRole('button', { name: 'Sell' }).click();
  await page.locator('#broker').waitFor({ state: 'visible', timeout: 10_000 });

  // After switching to Sell, the share options are the owned shares; pick the one matching our shareId
  await page.selectOption('#broker', brokerValue as string);
  // Wait for owned shares to populate
  await page.locator('#share').waitFor({ state: 'visible', timeout: 10_000 });
  await page.selectOption('#share', shareValue as string);
  await page.fill('#quantity', '1');
  await page.locator('button[type="submit"]').click();

  await expect(page.getByText('Trade Executed Successfully')).toBeVisible({ timeout: 10_000 });
  await page.waitForURL('**/portfolio', { timeout: 10_000 });

  // Verify UI holdings decreased back (or at least not below beforeQty)
  const holdingsRowAfterSell = page.locator('table >> text=' + companyName).first();
  await expect(holdingsRowAfterSell).toBeVisible({ timeout: 10_000 });
  const rowAfter = holdingsRowAfterSell.locator('xpath=ancestor::tr');
  const qtyAfterText = await rowAfter.locator('td').nth(1).textContent();
  const shownQtyAfter = parseInteger(qtyAfterText || '0');
  expect(shownQtyAfter).toBeGreaterThanOrEqual(beforeQty);

  // Backend: check trades appended with a Sell trade
  const tradesRes2 = await request.get(`${API_BASE}/api/trades/my-trades`, { headers: authHeaders });
  expect(tradesRes2.ok()).toBeTruthy();
  const trades2 = await tradesRes2.json();
  const sellTrade = trades2.find((t: any) => {
    const companyField = (t.companyName ?? t.CompanyName ?? t.company?.name ?? t.Company?.Name ?? '');
    const companyMatch = companyField.toString().trim() === companyName;
    const qty = (t.quantity ?? t.Quantity) ?? (t.Quantity ?? t.Quantity);
    const typeVal = t.type ?? t.Type;
    const isSell = typeVal === 1 || typeVal === 'Sell' || typeVal === 'sell';
    return companyMatch && qty === 1 && isSell;
  });
  if (!sellTrade) {
    try {
      const out2 = test.info().outputPath(`trades-my-trades-after-sell-${Date.now()}.json`);
      await fs.promises.mkdir(path.dirname(out2), { recursive: true });
      await fs.promises.writeFile(out2, JSON.stringify(trades2, null, 2));
      console.log('Saved trades JSON to', out2);
    } catch (err) {
      console.error('Failed to write trades JSON:', err);
    }
  }

  expect(sellTrade).toBeTruthy();

});
