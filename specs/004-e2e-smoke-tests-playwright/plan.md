# Plan: E2E Smoke Tests with Playwright

Companion technical design for `spec.md`. Describes the Playwright setup, config,
test layout, smoke test cases, and the CI job addition.

## Target file layout

```
playwright.config.ts        # Playwright config: webServer, baseURL, projects
e2e/
  fixtures/
    app-ready.ts             # helper: waits for isDbOk / loader to clear
  smoke/
    home.spec.ts             # "/"
    caixa.spec.ts            # "/caixa"
    metas.spec.ts             # "/metas"
    patrimonio.spec.ts        # "/patrimonio"
    emprestimos.spec.ts       # "/emprestimos"
    relatorios.spec.ts        # "/relatorios"
    notas.spec.ts             # "/notas"
    configuracoes.spec.ts     # "/configuracoes"
    faq.spec.ts                # "/faq"
    termos-de-uso.spec.ts      # "/termos-de-uso"
    politica-de-privacidade.spec.ts # "/politica-de-privacidade"
.github/workflows/ci.yml     # gains an `e2e` job (edited, not created — from spec 002)
package.json                 # new devDependency + "test:e2e" script (edited)
README.md                    # new "Running e2e tests" subsection (edited)
```

- `e2e/` sits at the repo root, parallel to `src/`, mirroring how Playwright projects are
  conventionally laid out (kept separate from Jest's colocated `__tests__/` convention
  since e2e tests aren't colocated with a single component).
- One spec file per route keeps failures easy to attribute and lets the suite be run
  file-by-file locally (`npx playwright test e2e/smoke/caixa.spec.ts`).

## `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

const basePath = '/gestao-financeira';
const port = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}${basePath}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // Builds the real static export and serves it exactly as GitHub Pages would
    // (basePath included), so the suite catches basePath-only regressions.
    command: 'npm run build && npx serve out -l 4173',
    url: `http://127.0.0.1:${port}${basePath}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- `npx serve` (the `serve` package) is added as a devDependency purely to host the static
  `out/` directory in a way that mirrors production hosting (no server-side routing
  logic, just static files) — lighter than standing up a custom Express server.
- `webServer.command` always runs a fresh `npm run build` so the suite never tests a
  stale `out/` directory left over from a previous local build.
- `basePath` is duplicated here (hard-coded `/gestao-financeira`) rather than imported
  from `next.config.js`, since that config file conditionally computes it based on
  `NODE_ENV` at Next's build time — for clarity, the e2e config keeps its own constant
  and a code comment cross-referencing `next.config.js` as the source of truth.

## `e2e/fixtures/app-ready.ts` — DB-ready helper

```ts
import { Page, expect } from '@playwright/test';

/**
 * Waits for the app's client-side sql.js/localforage database to finish
 * initializing (StorageProvider's `isDbOk`) before assertions run, and fails
 * fast if the page threw an unhandled JS exception.
 */
export async function waitForAppReady(page: Page) {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  // Loader shown while isDbOk is false; adjust selector to the real loader
  // component (`src/app/components/loader.tsx`) once implemented.
  await page.waitByTestId('app-loader').waitFor({ state: 'detached', timeout: 15_000 })
    .catch(() => {/* loader may not appear if DB init is fast enough */});

  expect(pageErrors, `Unhandled page errors: ${pageErrors.map(e => e.message).join(', ')}`)
    .toHaveLength(0);
}
```

- Requires adding a `data-testid="app-loader"` (or equivalent) to the shared loader/
  loading-state markup if one doesn't already expose a stable selector — a small,
  test-only markup addition, not a behavior change.
- Centralizing this in one fixture avoids duplicating the same wait/error-check logic
  across all 11 route spec files.

## Example smoke test — `e2e/smoke/caixa.spec.ts`

```ts
import { test, expect } from '@playwright/test';
import { waitForAppReady } from '../fixtures/app-ready';

test('Caixa page loads without errors', async ({ page }) => {
  await page.goto('/caixa');
  await waitForAppReady(page);

  await expect(page.getByRole('heading', { name: /caixa/i })).toBeVisible();
  await expect(page.locator('footer.bottom-navbar, header')).toBeVisible();
});
```

Each of the other 10 route spec files follows the same three-step shape (navigate → wait
for ready → assert key heading/chrome visible), with route path and expected heading text
swapped in per page.

## CI job addition — `.github/workflows/ci.yml`

Adds a **second job** to the workflow introduced by spec `002`, run alongside (not
blocking) `build-and-test`, using Playwright's official Docker-less browser install:

```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- Separate job (not appended as steps to `build-and-test`) so e2e failures are reported
  distinctly in the PR checks UI and so `npm run build` (already run once inside
  `webServer.command`) doesn't need to be duplicated/coordinated with the existing job's
  build step.
- `--with-deps chromium` only (not all browsers) keeps CI time down; the smoke suite's
  goal is regression coverage, not cross-browser matrix testing (a possible future
  enhancement, not in scope here).
- Playwright's HTML report is uploaded only `if: failure()` to help diagnose CI-only
  failures without bloating artifact storage on green runs.
- This job is additive to `ci.yml`; it depends on spec `002` having landed that file
  first (or being landed in the same PR as this work, if `002` is still pending).

## `package.json` changes

```jsonc
{
  "scripts": {
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.x",
    "serve": "^14.x"
  }
}
```

## README updates
Add a new subsection near the existing "Testing" instructions:
- Prerequisite: `npx playwright install --with-deps chromium` (one-time browser install).
- Command: `npm run test:e2e` (builds `out/`, serves it, runs the smoke suite headlessly).
- Note that e2e tests target the production static export (not `next dev`), so a full
  `npm run build` runs as part of `test:e2e` and may take longer than `npm test`.

## Risks / mitigations
- **Flakiness from async DB init** — mitigated by the shared `waitForAppReady` helper and
  a generous (15s) timeout, tuned during the "consistently green x3" acceptance check.
- **Service worker caching stale content between runs** — mitigated by each Playwright
  test using a fresh, isolated browser context (default behavior), so no SW/cache state
  persists across tests; if flakiness is still observed, disable SW registration via a
  Playwright `addInitScript` that no-ops `navigator.serviceWorker.register` for the e2e
  run only.
- **`basePath` drift** — mitigated by deriving the constant from a single, commented
  location in `playwright.config.ts` and covering `/` explicitly (the route most likely
  to break silently if `basePath`/`assetPrefix` misconfigure asset loading).
