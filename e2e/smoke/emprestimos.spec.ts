import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

// Skipped: /emprestimos is currently a "página em construção" placeholder
// (src/app/emprestimos/page.tsx) with no real feature behind it yet. Re-enable once the
// Empréstimos feature is implemented.
test.skip('Emprestimos page loads without errors', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('emprestimos');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Empréstimo', exact: true })).toBeVisible();
  await expect(page.locator('.sidebar')).toBeVisible();
});
