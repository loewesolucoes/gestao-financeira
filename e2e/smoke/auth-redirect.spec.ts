import { test, expect } from '@playwright/test';
import { collectPageErrors, waitForAppReady } from '../fixtures/app-ready';

// Regression tests for two related bugs in src/app/contexts/location.tsx (LocationProvider):
//
// 1. The original fix for the /notificacoes tab-switch crash (see notificacoes.spec.ts)
//    started `params` from a null-returning placeholder and only synced the real value one
//    commit later, via an effect. That broke this page: it reads the `code` query param once
//    on mount (`useEffect(..., [])`) to complete the Google OAuth handshake, and saw it as
//    missing — breaking sign-in entirely (`code` was always null on the very first render).
// 2. The final fix computes the initial `params` synchronously from `window.location.search`,
//    so `code` is available immediately on the first render, while still staying reactive to
//    later URL changes (needed for the /notificacoes tabs).
//
// The real Google token endpoint is mocked here so the test is deterministic and hermetic.
test('Auth redirect completes sign-in when a code is present in the URL on first render', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.route('https://oauth2.googleapis.com/token', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-token',
        refresh_token: 'fake-refresh-token',
        expires_in: 3600,
      }),
    });
  });

  await page.goto('auth/redirect?iss=https://accounts.google.com&code=FAKE_CODE_FOR_TEST&scope=https://www.googleapis.com/auth/drive');
  await waitForAppReady(page, pageErrors);

  // On success, `/auth/redirect` calls redirectTo('/'); wait for the actual navigation rather
  // than a fixed timeout.
  await page.waitForURL((url) => !url.pathname.endsWith('/auth/redirect'));

  await expect(page.getByText('Ocorreu um erro inesperado')).toHaveCount(0);
  await expect(page.getByText('Código de autenticação não encontrado na URL.')).toHaveCount(0);
  await expect(pageErrors, `Unhandled page errors: ${pageErrors.map(e => e.message).join(', ')}`).toHaveLength(0);

  await expect(page.context().cookies().then((cookies) => cookies.some((c) => c.name === 'gdriveauth'))).resolves.toBe(true);
});

test('Auth redirect shows a clear error when no code is present in the URL', async ({ page }) => {
  const pageErrors = collectPageErrors(page);

  await page.goto('auth/redirect');
  await waitForAppReady(page, pageErrors);

  await expect(page.getByRole('heading', { name: 'Ocorreu um erro inesperado' })).toBeVisible();

  await page.getByText('Detalhes do erro').click();
  await expect(page.locator('pre', { hasText: 'Código de autenticação não encontrado na URL.' })).toBeVisible();
});
