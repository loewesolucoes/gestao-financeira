import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

// Regression test for a bug where LocationProvider (src/app/contexts/location.tsx) called
// next/navigation's useSearchParams() conditionally (only until the first sync), violating
// the Rules of Hooks. Switching tabs on this page — which changes the `tipo` query param via
// redirectTo() while the page stays mounted — used to crash with "Rendered fewer hooks than
// expected. This may be caused by an accidental early return statement."
test('Notificacoes page allows switching tabs repeatedly without a hooks-order crash', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('notificacoes?tipo=notificacao');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Notificações e Mensagens' })).toBeVisible();

  const notificacoesTab = page.getByRole('button', { name: 'Notificações', exact: true });
  const mensagensTab = page.getByRole('button', { name: 'Mensagens', exact: true });

  await expect(notificacoesTab).toHaveClass(/active/);

  // Switch back and forth several times — the crash only manifested after the query string
  // changed while the component tree stayed mounted (i.e. not on the very first render).
  for (let i = 0; i < 3; i++) {
    await mensagensTab.click();
    await expect(page).toHaveURL(/tipo=mensagem/);
    await expect(mensagensTab).toHaveClass(/active/);
    await expect(pageErrors, `Unhandled page errors after switching to mensagem (iteration ${i}): ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);

    await notificacoesTab.click();
    await expect(page).toHaveURL(/tipo=notificacao/);
    await expect(notificacoesTab).toHaveClass(/active/);
    await expect(pageErrors, `Unhandled page errors after switching to notificacao (iteration ${i}): ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);
  }

  await expect(page.getByText('Ocorreu um erro inesperado')).toHaveCount(0);
});

test('Notificacoes page shows the seeded welcome mensagem', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('notificacoes?tipo=mensagem');
  await waitForAppReady(page, pageErrors);

  await expect(page.locator('.list-group-item').first()).toBeVisible();
});
