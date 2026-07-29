import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('FAQ page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('faq');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Perguntas frequentes' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
