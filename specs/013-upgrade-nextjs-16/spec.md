# Spec: Atualizar Next.js para a versão 16.x

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-29.

## Tracking
GitHub issue: [#6 — Atualizar versão do react e next](https://github.com/loewesolucoes/gestao-financeira/issues/6)
Related specs:
- `specs/012-upgrade-react-19-2/spec.md` — bump `react`/`react-dom` to
  19.2.x first (or alongside this spec). Next.js 16's App Router runs
  against a React Canary aligned with 19.2 features (View Transitions,
  `useEffectEvent`, `Activity`); keeping `react`/`react-dom` on 19.1.x while
  on Next 16 risks a mismatched setup.
- `specs/002-github-actions-ci-cd/` — CI already pins Node 22 (`ci.yml`,
  `deploy.yml`), which satisfies Next 16's new Node ≥20.9 minimum; no CI
  Node-version change expected, but double check during implementation.

## Problem statement
`package.json` pins `next`/`eslint-config-next` at `15.3.5`. Next.js 16 is
now the latest stable major release. Staying on 15.x means missing
performance improvements (Turbopack now stable/default, faster builds) and
accumulating upgrade debt, since 16 removes/changes several APIs the repo
currently relies on (notably the `next lint` CLI command used by
`npm run lint`).

### Why this is a problem
- `next lint` (used in `package.json`'s `"lint"` script) is **removed** in
  Next.js 16 — `npm run lint` would break as-is after a naive bump.
- Turbopack becomes the **default bundler** for `next dev`/`next build` in
  v16. This repo has a **custom webpack config** in `next.config.js`
  (`@svgr/webpack` for SVG imports, `copy-webpack-plugin` to copy sql.js's
  WASM/worker assets into `public/`, and `resolve.fallback` for
  `net`/`tls`/`fs`/`child_process`). Turbopack doesn't transparently apply
  an arbitrary webpack config, so this needs an explicit decision.
- Minimum Node version rises to 20.9+ and TypeScript to 5.1+ — repo already
  satisfies both (CI uses Node 22, `typescript` devDependency is 5.8.3),
  but worth confirming explicitly as part of the upgrade.
- Several sync-to-async API removals (`params`/`searchParams`,
  `cookies()`/`headers()`/`draftMode()`) don't apply here since this app has
  no dynamic `[param]` route segments and is a fully static, client-only
  export — but this should be explicitly verified, not assumed silently.

## Goals
1. Bump `next` and `eslint-config-next` from `15.3.5` to the latest `16.x`
   release available on npm at implementation time.
2. Replace the `next lint` script with a direct ESLint CLI invocation (per
   Next's own migration codemod: `npx @next/codemod@canary
   next-lint-to-eslint-cli .`), preserving current lint behavior/rules.
3. Decide and implement how the custom webpack config
   (`@svgr/webpack`, `copy-webpack-plugin`, `resolve.fallback`) is preserved
   under Next 16 — most likely by keeping Turbopack opted out via
   `next dev --webpack` / `next build --webpack` (documented decision, see
   `plan.md`), since rewriting the SVG/WASM asset pipeline for native
   Turbopack config is out of scope for this pass.
4. Confirm the static export (`output: 'export'`), Serwist PWA build
   (`@serwist/next`), and GitHub Pages deploy flow (`npm run build` →
   `npm run deploy`) all still work end to end after the bump.
5. Confirm `npm run lint`, `npm test`, `npm run build`, and
   `npm run test:e2e` (Playwright) all pass.

## Non-goals
- Adopting Next 16's new opt-in features: **Cache Components**
  (`cacheComponents: true`), **Turbopack filesystem caching**, **Next.js
  DevTools MCP**, **`proxy.ts`** (this repo has no `middleware.ts` to
  rename), or the **Build Adapters API** — none of these are relevant to a
  static-export, client-only app and are explicitly deferred.
- Migrating the custom webpack asset pipeline to native Turbopack loaders —
  documented as a future idea, not implemented now.
- Enabling the React Compiler (`babel-plugin-react-compiler`) — optional
  Next 16 feature, deferred.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation (editing `package.json`, `next.config.js`, CI
  workflows if needed) is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`). The upgrade must
  not require introducing server-side code paths.
- `basePath`/`assetPrefix` = `/gestao-financeira` outside dev, driven by the
  `PHASE_PRODUCTION_BUILD`/`PHASE_DEVELOPMENT_SERVER` branching in
  `next.config.js` — must keep working identically after the bump.
- The `copy-webpack-plugin` step that copies `sql.js`'s
  `sql-wasm.wasm`/`worker.sql-wasm.js` (and debug variants) into `public/`
  is **critical** — the app cannot load its database without these files;
  any bundler change must preserve this asset copy step exactly.
- CI (`ci.yml`, `deploy.yml`) already runs Node 22 — no version bump needed
  there, but confirm the workflows still pass as part of this spec.
- ESLint config stays on `next/core-web-vitals` (per repo conventions) —
  only the *invocation mechanism* (`next lint` → `eslint` CLI) changes, not
  the ruleset, unless the codemod/migration forces a config shape change.
- UI copy must be in **Brazilian Portuguese (pt-br)** — unaffected.

## Acceptance criteria
- [ ] `package.json` `dependencies.next` and `devDependencies.eslint-config-next`
      reference the same new `16.x` version.
- [ ] `npm run lint` works via plain ESLint CLI (no `next lint` dependency)
      and produces equivalent results to the pre-upgrade lint run.
- [ ] `npm run dev` and `npm run build` both succeed, explicitly documented
      whether Turbopack or webpack (`--webpack` flag) is used and why.
- [ ] `out/` after `npm run build` still contains `sql-wasm.wasm`,
      `worker.sql-wasm.js` (and debug variants) and the app boots and reads/
      writes its sql.js database correctly when served locally.
- [ ] PWA service worker (`sw.js`) is still generated and the offline
      fallback page (`src/app/offline`) still works.
- [ ] `npm test` (Jest) and `npm run test:e2e` (Playwright) both pass.
- [ ] CI workflows (`ci.yml`, `deploy.yml`) pass unchanged (or with the
      minimal changes documented in `plan.md`).
- [ ] `basePath`/`assetPrefix` GitHub Pages deployment still resolves
      correctly (manual check against a deployed preview or local static
      serve with the `/gestao-financeira` base path).

## Future ideas (documented only — not implemented by this spec)
- Migrate the SVG (`@svgr/webpack`) and WASM asset-copy (`copy-webpack-plugin`)
  pipeline to native Turbopack config once Next.js's Turbopack loader/asset
  APIs cover these use cases, to drop the `--webpack` flag and get full
  Turbopack speed benefits.
- Evaluate Cache Components / PPR if this app ever gains server-rendered or
  hybrid routes (currently N/A for a fully static export).
- Adopt React Compiler support once available and validated.
