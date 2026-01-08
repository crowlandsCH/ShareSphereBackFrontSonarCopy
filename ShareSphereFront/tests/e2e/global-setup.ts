import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function globalSetup() {
  const base = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
  const username = process.env.E2E_USER_USERNAME ?? process.env.E2E_USER_EMAIL ?? 'jsmith';
  const password = process.env.E2E_USER_PASSWORD ?? 'User123!';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const authDir = path.resolve(__dirname, '..', '.auth');
  fs.mkdirSync(authDir, { recursive: true });
  const storagePath = path.join(authDir, 'state.json');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${base}/login`);

  // Fill username (prefer data-testid if UI provides it)
  const usernameTestId = page.locator('[data-testid="login-username"]');
  if (await usernameTestId.count() > 0) {
    await usernameTestId.fill(username);
  } else {
    await page.getByPlaceholder('Username').fill(username);
  }

  const passwordTestId = page.locator('[data-testid="login-password"]');
  if (await passwordTestId.count() > 0) {
    await passwordTestId.fill(password);
  } else {
    await page.getByPlaceholder('Password').fill(password);
  }

  // Submit (prefer test id)
  const submitTestId = page.locator('[data-testid="login-submit"]');
  if (await submitTestId.count() > 0) {
    await submitTestId.click();
  } else {
    await page.getByRole('button', { name: 'Login' }).click();
  }

  // Wait for navigation to indicate login success
  try {
    await page.waitForURL('**/', { timeout: 10_000 });
  } catch (e) {
    // If the app uses a different redirect, give a small delay to allow storage to be set
    await page.waitForTimeout(1500);
  }

  // Save authenticated storage state for reuse in tests
  await page.context().storageState({ path: storagePath });
  await browser.close();
}
