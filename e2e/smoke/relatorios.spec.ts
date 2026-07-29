import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Relatorios page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('relatorios');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Relatórios', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
