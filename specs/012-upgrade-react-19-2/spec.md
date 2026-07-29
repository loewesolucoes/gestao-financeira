# Spec: Atualizar React para a última versão 19.x

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-29.

## Tracking
GitHub issue: [#47 — Atualizar React para a última versão 19.2.x](https://github.com/loewesolucoes/gestao-financeira/issues/47)
Related specs:
- `specs/013-upgrade-nextjs-16/spec.md` — Next.js 16 ships/expects React 19.2
  features (View Transitions, `useEffectEvent`, `Activity`) and its App
  Router runs against a React Canary aligned with 19.2. Land this spec
  before or together with 013 so `package.json` never has a mismatched
  React version while Next 16 is in place.

## Problem statement
The app currently pins `react`/`react-dom` at `19.1.0` (`package.json`).
React has since released `19.2.x` with bug fixes and new stable APIs
(`useEffectEvent`, `<Activity/>`, `ViewTransition`). Staying on `19.1.0`
means missing patch-level bug fixes and forces a mismatched setup once
Next.js is upgraded (see spec 013), since Next 16's App Router is built and
tested against React 19.2.

### Why this is a problem
- `19.1.0` is behind on patch/minor fixes released since March 2025.
- Peer-dependency friction: newer `eslint-config-next`/`next` releases are
  developed and tested against React 19.2; keeping React older invites
  subtle incompatibilities once Next is bumped (spec 013).
- No functional bugs are currently attributed to React itself, but this is
  routine dependency hygiene expected before/alongside the Next.js major
  bump.

## Goals
1. Bump `react` and `react-dom` from `19.1.0` to the latest `19.2.x` release
   available on npm at implementation time.
2. Bump `@types/react` and `@types/react-dom` (and the matching entries in
   the `overrides` block) to the versions matching the new React release.
3. Confirm the app builds, lints, and all existing automated tests
   (`npm test`, `npm run lint`) still pass unchanged — this is a
   dependency-only bump, not a feature adoption.
4. Confirm the PWA/service worker (Serwist) and sql.js Web Worker/
   BroadcastChannel data layer are unaffected (manual smoke test).

## Non-goals
- Adopting any new React 19.2 APIs (`useEffectEvent`, `<Activity/>`,
  `ViewTransition`) in app code — that's a separate future feature effort,
  not part of this dependency bump.
- Enabling the React Compiler (`babel-plugin-react-compiler`) — Next.js 16
  supports it, but turning it on is out of scope here; tracked as a future
  idea under spec 013.
- Upgrading Next.js itself — see spec `013-upgrade-nextjs-16`.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation (editing `package.json`, running `npm install`) is a
  follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`). React version bumps
  must not require any changes to this data layer.
- Monetary values must use **`bignumber.js`**, dates must use **`moment`** —
  unaffected by this bump, called out for completeness.
- UI copy must be in **Brazilian Portuguese (pt-br)** — unaffected.
- `strict` is `false` in `tsconfig.json`; new `@types/react` versions must
  not introduce type errors under the current (non-strict) config.
- React 19.2's `reactStrictMode` behavior — repo has
  `reactStrictMode: false` in `next.config.js`; keep as-is (no change in
  scope) unless the upgrade task uncovers a reason to revisit it.
- Any bump must keep `react`/`react-dom` versions in lockstep with each
  other and with `@types/react`/`@types/react-dom` (mirrored in the
  top-level `overrides` block in `package.json`).

## Acceptance criteria
- [ ] `package.json` `dependencies.react`, `dependencies.react-dom`,
      `devDependencies.@types/react`, `devDependencies.@types/react-dom`,
      and the `overrides` block all reference the same new `19.2.x` version
      set (react/react-dom version, and matching `@types/*` versions).
- [ ] `npm install` completes with no peer-dependency conflicts.
- [ ] `npm run lint` passes with no new warnings/errors.
- [ ] `npm test` passes (full Jest suite) with no changes needed to test
      files or mocks.
- [ ] `npm run build` produces a working static export in `out/`.
- [ ] Manual smoke test: app loads, `caixa`/`metas`/`patrimonio` pages
      render and read/write to the sql.js DB correctly, PWA offline page
      still works.

## Future ideas (documented only — not implemented by this spec)
- Adopt `<Activity/>` for tab-like UI sections that should preserve state
  when hidden (e.g. `caixa` month tabs) once Next.js 16 (spec 013) has
  landed.
- Adopt `useEffectEvent` where existing `useEffect` + ref-tracking
  workarounds exist in contexts (`src/app/contexts/*`).
- Evaluate enabling the React Compiler once on Next.js 16.
