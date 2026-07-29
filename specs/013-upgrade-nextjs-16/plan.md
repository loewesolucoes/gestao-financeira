# Plan: Atualizar Next.js para a versão 16.x

Companion technical design for `spec.md`. This is primarily a dependency
version bump plus config/script adjustments — no data model or repository
changes.

## Data model
No schema changes.

## Migration
No migration needed.

## Repository (`src/app/repositories/<nome>.ts`)
No repository changes needed.

## Registering the repository (`src/app/contexts/storage.tsx`)
No new repository to register.

## Target file layout
```
package.json           # version bumps + "lint" script change
next.config.js          # add --webpack decision (see below); no structural rewrite expected
.github/workflows/ci.yml       # verify only, no change expected (Node 22 already ≥ 20.9)
.github/workflows/deploy.yml   # verify only, no change expected
```
No new source files under `src/app/**`.

## Dependency changes
| Package | Current | Target |
| --- | --- | --- |
| `next` | 15.3.5 | latest `16.x` (check `npm view next version` at implementation time) |
| `eslint-config-next` | 15.3.5 | version matching the chosen `next` release |

Steps:
1. Run the official codemod first, from repo root:
   `npx @next/codemod@canary upgrade latest` — this updates `next`/`react`/
   `react-dom` and applies automated code transforms (safe to run even if
   spec 012 already bumped React; codemod is idempotent).
2. If the codemod doesn't cover `eslint-config-next`, bump it manually:
   `npm install -D eslint-config-next@latest`.
3. Run the lint-CLI codemod: `npx @next/codemod@canary next-lint-to-eslint-cli .`
   — this rewrites `package.json`'s `"lint"` script from `next lint` to a
   direct `eslint` invocation and may add/adjust an `eslint.config.*` or
   `.eslintrc.json` as needed for the flat-config/legacy setup already in
   the repo.
4. Manually verify the resulting `"lint"` script still targets the same
   directories/patterns as before (compare old `next lint` default scope
   vs. the new explicit `eslint` invocation).

## `next.config.js` changes
- **Bundler decision**: keep using webpack explicitly rather than Turbopack,
  because of the custom `webpack()` function (svgr loader, copy-webpack-plugin
  for sql.js WASM assets, `resolve.fallback`). Concretely:
  - Update `package.json` scripts: `"dev": "next dev --webpack"`,
    `"build": "next build --webpack"` (Turbopack is default in v16, so the
    flag must be added explicitly to opt back into webpack).
  - Document in a short comment above the `webpack()` function in
    `next.config.js` why webpack is still required (SVG/WASM asset
    pipeline), so a future contributor doesn't strip the flag thinking it's
    a leftover.
- Check for any removed/renamed experimental flags used in
  `next.config.js` — current file has `// experimental: { missingSuspenseWithCSRBailout: false, }`
  commented out already, so nothing active to migrate there. Re-verify
  against the removed-options table in the Next 16 upgrade guide
  (`experimental.turbopack` moved to top-level `turbopack`,
  `experimental.dynamicIO` renamed to `cacheComponents`,
  `experimental.ppr` removed) — none currently used, so likely a no-op, but
  confirm no residual experimental keys trigger warnings on `next build`.
- No `middleware.ts` exists in this repo, so the `proxy.ts` rename is N/A.
- No AMP usage (`useAmp`, `export const config = { amp: true }`) — confirmed
  via grep during spec drafting; nothing to remove.
- Confirm `images: { unoptimized: true }` config is still valid (it is —
  unaffected by the `next/image` local-src-with-query-string change, since
  this repo doesn't optimize images).

## UI design
No UI/component changes expected. If the `upgrade latest` codemod touches
any `src/app/**` files (e.g. auto-adding `"use client"` directives or
async/await on APIs), review each diff individually against the Non-goals
(no dynamic route segments exist, so this should be a no-op) before
accepting.

## Testing strategy
- `npm run lint` — first smoke test after the lint-CLI codemod; confirm it
  runs clean and catches the same issues as the old `next lint`.
- `npm test` — full Jest suite; component tests are colocated in
  `__tests__/` folders and mock the storage context, so they shouldn't be
  sensitive to the Next.js bundler/version change, but run them to confirm.
- `npm run build` — confirms the static export still succeeds under
  `output: 'export'` with `--webpack`; inspect `out/` for the presence of
  `sql-wasm.wasm`, `worker.sql-wasm.js`, `sql-wasm-debug.wasm`,
  `worker.sql-wasm-debug.js`, and `sw.js` (Serwist output).
- `npm run test:e2e` — Playwright smoke tests (per spec
  `004-e2e-smoke-tests-playwright`) exercise the built app end to end;
  these are the most important signal that the static export + PWA still
  behaves correctly for a real user.
- Manual verification:
  - Serve `out/` locally (e.g. via the repo's existing `serve-handler`
    devDependency or a simple static server) with the `/gestao-financeira`
    base path to confirm `basePath`/`assetPrefix` still resolve assets
    correctly.
  - Load the app, confirm the sql.js DB initializes (Web Worker +
    BroadcastChannel), create/edit/delete a transaction in `caixa`, and
    confirm it persists after a reload (localforage roundtrip).
  - Kill network (devtools offline mode) and confirm the PWA offline
    fallback page still renders.
- CI: push a branch and confirm `ci.yml` passes (lint/test/build steps) with
  no changes required beyond what's already planned above.

## Rollout / risk mitigation
1. Land spec 012 (React bump) first, or in the same PR, so `package.json`
   never has a Next 16 + React 19.1 mismatch.
2. Run the official `@next/codemod@canary upgrade latest` rather than
   hand-editing versions, to pick up any automated source transforms for
   free and reduce manual-migration risk.
3. Immediately verify the two highest-risk items for this repo specifically:
   (a) the `next lint` → `eslint` CLI script rewrite, and (b) the WASM/SVG
   webpack asset pipeline under `--webpack` — these are the two concrete
   breaking changes that apply to this codebase (see spec.md's "Why this is
   a problem").
4. Full lint/test/build/e2e gate (see Testing strategy) before opening a PR.
5. Manual smoke test of the deployed-shape static export (served with the
   `/gestao-financeira` base path) before considering the upgrade done,
   since GitHub Pages deploy is the actual production target.
