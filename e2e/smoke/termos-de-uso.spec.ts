import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Termos de uso page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('termos-de-uso');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Termos de uso', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
