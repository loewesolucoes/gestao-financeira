import { Page, expect } from '@playwright/test';

/**
 * Waits for the app's client-side sql.js/localforage database to finish initializing
 * (StorageProvider's `isDbOk`) before assertions run, and fails if the page threw an
 * unhandled JS exception. Attach the `pageerror` listener as early as possible (right
 * after `page.goto`) so no error is missed.
 */
export async function waitForAppReady(page: Page, pageErrors: Error[]) {
  // The shared Loader component (src/app/components/loader.tsx) renders a
  // data-testid="app-loader" spinner while a page's local isLoading/isDbOk-gated state
  // is true. It may not appear at all if DB init + data load finish before Playwright
  // gets a chance to observe it, so absence is not itself a failure.
  const loader = page.getByTestId('app-loader').first();
  await loader
    .waitFor({ state: 'visible', timeout: 2_000 })
    .catch(() => {/* loader may never appear if init is fast enough */ });
  await loader
    .waitFor({ state: 'detached', timeout: 15_000 })
    .catch(() => {/* already gone / never appeared */ });

  expect(pageErrors, `Unhandled page errors: ${pageErrors.map(e => e.message).join(', ')}`)
    .toHaveLength(0);
}

/** Registers a `pageerror` collector; call before `page.goto` and pass the array to waitForAppReady. */
export function collectPageErrors(page: Page): Error[] {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  return pageErrors;
}
