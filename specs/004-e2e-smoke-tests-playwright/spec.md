# Spec: E2E Smoke Tests with Playwright

## Status
`Draft` — not yet started.

## Tracking
Related specs: [002-github-actions-ci-cd](../002-github-actions-ci-cd/spec.md) (this spec's
CI job depends on `.github/workflows/ci.yml`, which `002` introduces and is itself still
`Draft`/not yet merged at the time this spec was written).

## Problem statement
The project has Jest unit/component tests (colocated under `__tests__/` folders, run via
`npm test`), but **no end-to-end tests**. Nothing exercises the app the way a real user
would: opening the app in a real browser, waiting for the sql.js/localforage database to
initialize, and navigating between the main feature pages (Início, Caixa, Metas,
Patrimônio, Empréstimos, Relatórios, Notas, Configurações, FAQ, and the legal pages).

### Why this is a problem
- **No regression safety net for navigation/rendering** — a broken route, a page stuck on
  its loading state (`isDbOk` never becoming `true`), a client-side exception during
  initial render, or a broken PWA/service-worker registration would not be caught by unit
  tests, which mock the storage/repository layer and never boot the real sql.js worker.
- **Static export correctness is unverified** — the app is built with `output: 'export'`
  and served with a `basePath` (`/gestao-financeira`) in production (GitHub Pages), but
  nothing today verifies the actual exported `out/` bundle boots correctly with that
  `basePath`; `next dev` (used for manual testing) does not use a `basePath` at all, so a
  `basePath`-only bug could reach production undetected.
- **No CI gate for "does the app actually load"** — `002-github-actions-ci-cd`'s planned
  `ci.yml` runs lint/test/build, but a successful build does not guarantee the exported
  site actually renders in a browser without runtime errors.

## Goals
1. Introduce Playwright as the project's e2e testing framework (new devDependency).
2. Add a **smoke test suite** that, for each of the app's main routes, loads the page
   (against the built static export in `out/`, not `next dev`) and asserts:
   - the page reaches a rendered, non-error state (no unhandled client exception /
     React error boundary triggered),
   - the app's chrome (header, and bottom navbar) is present,
   - the page's expected key heading/content is visible,
   - the client-side database becomes ready (`isDbOk`) within a reasonable timeout
     without needing to seed any server-side state (there is no server).
3. Cover, at minimum, all primary navigable routes: `/`, `/caixa`, `/metas`,
   `/patrimonio`, `/emprestimos`, `/relatorios`, `/notas`, `/configuracoes`, `/faq`,
   `/termos-de-uso`, `/politica-de-privacidade`.
4. Wire the smoke suite into CI as a new job/step in `.github/workflows/ci.yml`
   (from spec `002`), so a broken route/render is caught on every pull request.
5. Document how to run the e2e suite locally (new `npm` script(s), README note).

## Non-goals
- **Not** writing deep, feature-specific e2e flows in this spec (e.g. creating a
  transação in Caixa, completing a meta, registering an empréstimo, exporting/importing
  the DB, Google Drive backup/restore) — those are valuable but belong to future,
  narrower specs once the smoke-suite scaffolding exists.
- **Not** exercising the Google Drive OAuth flow (`AuthProvider`) — real OAuth requires
  external, authenticated Google accounts and is not practical/safe to automate in CI;
  smoke tests must not depend on being signed in.
- **Not** switching or adding a second e2e framework (e.g. Cypress) — Playwright only.
- **Not** testing against `next dev` — the suite targets the static export (`out/`)
  produced by `npm run build`, to catch static-export/`basePath`-specific issues.
- **Not** introducing visual/screenshot regression testing in this pass.
- **Not** changing branch protection / required status checks (follow-up, as already
  noted as out of scope in spec `002`).

## Constraints (project-specific)
- App is **client-only**: all data lives in sql.js (SQLite-to-WASM) running in a Web
  Worker, persisted to `localforage`, coordinated via `BroadcastChannel`
  (`src/app/workers/db-broadcast.ts`, `db-connector.ts`). There is no API to seed or
  reset data — each Playwright test gets a fresh isolated browser context
  (new profile ⇒ empty `localforage`/IndexedDB), which is sufficient for smoke coverage.
  There is no server-side way to guarantee zero console errors; tests should instead
  detect unhandled JS exceptions on the page via Playwright's `page.on('pageerror', ...)`.
- Pages gate meaningful content behind `isDbOk`/loading states from `StorageProvider`
  (`src/app/contexts/storage.tsx`) — smoke tests must wait for readiness (e.g. a loader
  disappearing, or key content becoming visible) rather than asserting immediately after
  navigation or relying on `networkidle` alone.
- Static export config (`next.config.js`): `output: 'export'`, `basePath` and
  `assetPrefix` are `/gestao-financeira` **outside** dev (`isDev` check based on
  `NODE_ENV`) and empty in dev. The e2e suite must build with the **production**
  config (i.e. run `npm run build`, not rely on dev-only behavior) and serve `out/`
  with that `basePath` in mind, so Playwright's `baseURL` must include the base path
  segment used in the real deployment.
- A service worker (Serwist, `src/app/service-worker/app-worker.ts`) registers on load
  and there's an offline fallback page (`src/app/offline`) — must be accounted for so it
  doesn't cause flakiness (e.g. stale cached responses across test runs) in the smoke
  suite's serving strategy.
- CI must reuse the existing `npm ci` step and Node version (22.x, per spec `002`); no
  new Node version pin should be introduced.
- App is localized in pt-br — test assertions on visible text must use the actual
  Portuguese copy shown in the UI.

## Acceptance criteria
- [ ] Playwright is added as a devDependency with a `playwright.config.ts` at the repo
      root, configured to build (`npm run build`) and serve `out/` (respecting
      `basePath`) as its `webServer`, with `baseURL` pointed at that served static site.
- [ ] A new `npm` script (e.g. `test:e2e`) runs the Playwright suite headlessly.
- [ ] A smoke test exists for each of the 11 routes listed in Goal 3, each asserting: no
      unhandled page error, app chrome present, key page content visible, DB-ready state
      reached within a bounded timeout.
- [ ] `.github/workflows/ci.yml` gains a step/job that installs Playwright browsers and
      runs `npm run test:e2e` as part of the PR gate, without breaking the existing
      lint/test/build steps from spec `002`.
- [ ] README documents how to run the e2e suite locally (prerequisites, command, and how
      it differs from `npm test`).
- [ ] The full smoke suite passes consistently (no flaky failures across at least 3
      consecutive local runs) before being marked done.
