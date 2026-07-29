import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Caixa page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('caixa');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Caixa', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
