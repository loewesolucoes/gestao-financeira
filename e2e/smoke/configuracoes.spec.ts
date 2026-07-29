import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

test('Configuracoes page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('configuracoes');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Configurações da aplicação' })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
