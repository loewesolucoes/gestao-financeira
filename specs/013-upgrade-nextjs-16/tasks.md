# Tasks: Atualizar Next.js para a versão 16.x

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit. Assumes `specs/012-upgrade-react-19-2`
tasks are done first (or are bundled into the same PR).

- [ ] **T1 — Check latest published Next.js versions**
  - Run `npm view next version` and `npm view eslint-config-next version`
    to confirm the exact `16.x` target at implementation time.

- [ ] **T2 — Run the official upgrade codemod**
  - `npx @next/codemod@canary upgrade latest` from repo root; review the
    diff it produces (should mainly touch `package.json` and possibly
    `next.config.js`).
  - Manually bump `eslint-config-next` if the codemod didn't cover it.

- [ ] **T3 — Migrate the lint script off `next lint`**
  - `npx @next/codemod@canary next-lint-to-eslint-cli .`.
  - Verify `package.json`'s `"lint"` script now calls `eslint` directly and
    still targets the intended files/dirs; run `npm run lint` and diff the
    findings against a pre-upgrade lint run for parity.

- [ ] **T4 — Keep webpack for the custom asset pipeline**
  - Update `"dev"`/`"build"` scripts in `package.json` to
    `"next dev --webpack"` / `"next build --webpack"`.
  - Add a short comment above the `webpack()` function in `next.config.js`
    explaining why webpack is kept (svgr + copy-webpack-plugin for sql.js
    WASM assets), so it isn't mistaken for leftover config later.

- [ ] **T5 — Audit `next.config.js` for removed/renamed options**
  - Confirm no active use of `experimental.turbopack`,
    `experimental.dynamicIO`, `experimental.ppr`, `serverRuntimeConfig`,
    `publicRuntimeConfig`, or `devIndicators.{appIsrStatus,buildActivity,buildActivityPosition}`.
    (Preliminary check during spec drafting found none of these in use.)

- [ ] **T6 — Lint/build/test gate**
  - Run `npm run lint`, `npm test`, `npm run build`; fix any fallout
    strictly caused by the version bump/config changes.

- [ ] **T7 — Verify static export assets**
  - Inspect `out/` after `npm run build` for `sql-wasm.wasm`,
    `worker.sql-wasm.js`, `sql-wasm-debug.wasm`, `worker.sql-wasm-debug.js`,
    and `sw.js`.

- [ ] **T8 — Playwright e2e gate**
  - Run `npm run test:e2e` against the freshly built app; fix any failures
    caused by the upgrade.

- [ ] **T9 — Manual smoke test with production base path**
  - Serve `out/` locally under the `/gestao-financeira` base path; verify
    the app loads, the sql.js DB reads/writes and persists across reload,
    and the PWA offline fallback works when network is disabled.

- [ ] **T10 — CI verification**
  - Push the branch and confirm `.github/workflows/ci.yml` passes
    end-to-end with no changes required beyond what's already planned.

- [ ] **TN — Lint/build/test gate (final)**
  - Re-run `npm run lint` and `npm test` (full suite), plus
    `npm run test:e2e`, and confirm everything passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Migrating the SVG/WASM webpack asset pipeline to native Turbopack config.
- Enabling Cache Components (`cacheComponents: true`) or PPR.
- Adopting the Next.js DevTools MCP.
- Enabling the React Compiler.
