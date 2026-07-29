import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Politica de privacidade page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('politica-de-privacidade');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Política de Privacidade', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
