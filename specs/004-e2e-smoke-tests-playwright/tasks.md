# Tasks: E2E Smoke Tests with Playwright

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task should be
a small, reviewable commit.

- [ ] **T1 — Install Playwright and `serve`**
  - `npm install -D @playwright/test serve` and commit the resulting `package-lock.json`
    changes.
  - Run `npx playwright install --with-deps chromium` locally (not committed; a
    machine-local browser install).

- [ ] **T2 — Add `playwright.config.ts`**
  - `testDir: './e2e'`, `webServer` running `npm run build && npx serve out -l 4173`,
    `baseURL` including the `/gestao-financeira` basePath, `chromium` project only.
  - Add `npm run test:e2e` script (`"playwright test"`) to `package.json`.
  - Add `/playwright-report/`, `/test-results/`, and `/blob-report/` to `.gitignore`.

- [ ] **T3 — Add the `app-ready` fixture**
  - Create `e2e/fixtures/app-ready.ts` exporting `waitForAppReady(page)`: attaches a
    `pageerror` listener, waits for the app's loading indicator to clear (add a stable
    `data-testid="app-loader"` to the shared loader component if none exists yet), and
    asserts zero unhandled page errors.

- [ ] **T4 — Write the first smoke test (home page)**
  - `e2e/smoke/home.spec.ts`: navigate to `/`, call `waitForAppReady`, assert the header/
    bottom navbar and a key "Início" element are visible.
  - Run `npm run test:e2e` locally and get this one test green before adding the rest —
    validates the whole `webServer`/`baseURL`/basePath wiring end-to-end.

- [ ] **T5 — Write remaining route smoke tests**
  - Add one spec file per remaining route, following T4's pattern: `caixa.spec.ts`,
    `metas.spec.ts`, `patrimonio.spec.ts`, `emprestimos.spec.ts`, `relatorios.spec.ts`,
    `notas.spec.ts`, `configuracoes.spec.ts`, `faq.spec.ts`, `termos-de-uso.spec.ts`,
    `politica-de-privacidade.spec.ts`.
  - Each asserts: no unhandled page error, app chrome visible, route's key heading/
    content visible.

- [ ] **T6 — Stabilize against service worker / cache flakiness**
  - Run the full suite 3+ times locally in a row; if stale SW caching causes flaky
    failures, add an `addInitScript` in `playwright.config.ts`'s `use` block (or per-test)
    to no-op `navigator.serviceWorker.register` during e2e runs.
  - Confirm 3 consecutive fully-green local runs before proceeding (per spec's acceptance
    criteria).

- [ ] **T7 — Wire `e2e` job into `.github/workflows/ci.yml`**
  - Depends on spec `002-github-actions-ci-cd`'s `ci.yml` existing — if `002` hasn't
    landed yet, coordinate so this task adds its job to the same PR/file rather than
    creating a duplicate workflow.
  - Add the `e2e` job: checkout, setup-node (22, `cache: npm`), `npm ci`,
    `npx playwright install --with-deps chromium`, `npm run test:e2e`, and an
    `actions/upload-artifact@v4` step for `playwright-report/` gated on `if: failure()`.

- [ ] **T8 — Validate CI**
  - Open a PR and confirm the new `e2e` job runs and passes alongside `build-and-test`.
  - Intentionally break one smoke test locally (not committed) to confirm a failure
    correctly fails the job and uploads the HTML report artifact.

- [ ] **T9 — Update README**
  - Add a "Running e2e tests" subsection near the existing testing instructions:
    one-time `npx playwright install --with-deps chromium`, then `npm run test:e2e`;
    note it builds+serves the production static export rather than using `next dev`.

## Out of scope (future follow-ups, not part of this work)
- Deep, feature-specific e2e flows (creating transações, completing metas, registering
  empréstimos, DB export/import, Google Drive backup/restore).
- Testing the Google Drive OAuth sign-in flow.
- Cross-browser matrix (Firefox/WebKit) or mobile-viewport project variants.
- Visual/screenshot regression testing.
- Branch protection / required status checks referencing the new `e2e` job.
