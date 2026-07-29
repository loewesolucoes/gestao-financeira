import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Home page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  // No leading slash: baseURL ends with '/gestao-financeira/', and a leading '/' here
  // would resolve against the origin, dropping the basePath (see playwright.config.ts).
  await page.goto('');
  await waitForAppReady(page, pageErrors);

  // Home's <h1> shows a time-of-day greeting ("Bom dia"/"Boa tarde"/"Boa noite"/"Bem
  // vindo") rather than static text, so assert it renders instead of matching one string.
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
