import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Patrimonio page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('patrimonio');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Patrimônio', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
