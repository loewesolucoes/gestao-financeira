import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Notas page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('notas');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Notas', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
