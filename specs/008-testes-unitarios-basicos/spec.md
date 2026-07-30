# Spec: Testes unitários básicos (utils, repositório padrão, formulários)

## Status
`Done` — implemented on 2026-07-29 (see `tasks.md`). Originally captured from a
design discussion on 2026-07-27.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/13
Related specs: [004-e2e-smoke-tests-playwright](../004-e2e-smoke-tests-playwright/spec.md)
covers browser-level e2e smoke tests (Playwright, real sql.js/service-worker
boot) — still `Draft`, a separate future pass. This spec (`008`) covers
Jest-level unit tests for utils/repositories/components instead; there is no
overlap between the two.

## Problem statement
Today the project has exactly **one** test file —
`src/app/caixa/components/__tests__/transacao-form.test.tsx` — despite Jest +
React Testing Library already being fully configured (`jest.config.ts`,
`npm test`). Everything else is untested: the pure helper classes in
`src/app/utils/` (`NumberUtil`, `DateUtil`, `EnumUtil`), the shared
`DefaultRepository` (`src/app/repositories/default.ts`) that every
feature repository extends, and every other form/component
(`metas-form.tsx`, `nota-form.tsx`, etc.).

### Why this is a problem
- Issue #13 explicitly asks for "at least basic tests to quickly validate if
  something broke" — currently a regression in date/currency formatting, SQL
  param building, or row mapping would not be caught by any automated test.
- `DefaultRepository` centralizes `save`/`delete`/`list`/`get`, parameter
  serialization (`parseToCommand`), and row mapping (`parseSqlResultToObj`,
  including `BigNumber`/`moment` conversions) for **every** repository in the
  app — it is the single highest-leverage place to add tests.
- Only one of several similar form components (`transacao-form.tsx`) has a
  smoke test; `metas-form.tsx` and `nota-form.tsx` follow the same
  conventions (mockable `useStorage` context) but have no coverage at all.

## Goals
1. Add pure unit tests for `src/app/utils/number.ts` (`NumberUtil`),
   `src/app/utils/date.ts` (`DateUtil`), and `src/app/utils/enum.ts`
   (`EnumUtil`) — no mocking required.
2. Add unit tests for `DefaultRepository`
   (`src/app/repositories/default.ts`) by mocking the small `IDatabase`
   interface (`exec`/`export`/`open`) so the real sql.js/Web Worker stack is
   never touched, covering: `save` (insert vs. update path), `delete`,
   `list`/`get` row mapping across `MapperTypes` (`DATE`, `DATE_TIME`,
   `NUMBER`, `BOOLEAN`, `IGNORE`, default `BigNumber` fallback), and
   `parseToCommand` parameter/`Date`/`BigNumber` serialization.
3. Add component smoke tests for `metas-form.tsx` and `nota-form.tsx`,
   mirroring the existing `transacao-form.test.tsx` pattern (mock
   `useStorage`, render, basic field/submit interaction).

## Non-goals
- Testing `RepositoryUtil` (`src/app/utils/repository.ts`) or
  `database-connector.ts` — these need localforage/Blob/base64 or a real Web
  Worker and are heavier to mock; deferred to a future spec (see "Future
  ideas").
- Full test coverage of every component/page in the app.
- End-to-end/browser-level tests — already tracked separately by spec `004`.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- Monetary values must use **`bignumber.js`**, dates must use **`moment`** —
  new tests must assert against these types, not plain floats/native `Date`
  strings.
- Tests must follow existing conventions: colocated `__tests__/` folders,
  `*.test.ts`/`*.test.tsx` naming, Jest + React Testing Library, mocking
  `useStorage` for components (no hitting the real sql.js/localforage stack
  in component tests).
- UI copy must remain in Brazilian Portuguese (pt-br); tests should assert
  against the existing pt-br labels/text.

## Acceptance criteria
- [x] `NumberUtil`, `DateUtil`, and `EnumUtil` each have a `__tests__` file
      covering their public methods, including edge cases (`null`/`NaN`/
      `Infinity` inputs for `NumberUtil`, hour boundaries for
      `DateUtil.generateGreetings`).
- [x] `DefaultRepository` has a `__tests__` file with a mocked `IDatabase`
      covering `save` (insert + update), `delete`, `list`, `get`, and mapper
      behavior for every `MapperTypes` value.
- [x] `metas-form.tsx` and `nota-form.tsx` each have a smoke test (render +
      basic submit) following the `transacao-form.test.tsx` pattern.
- [x] `npm run lint` and `npm test` (including new tests) pass once
      implemented.

## Future ideas (documented only — not implemented by this spec)
- Unit tests for `RepositoryUtil` (localforage persistence, base64/Blob
  dump parsing) with `localforage` mocked.
- Tests for `database-connector.ts` using a mocked `Worker`/`BroadcastChannel`.
- Smoke tests for the remaining feature components (`caixa`, `patrimonio`,
  `emprestimos`, `relatorios`, `home` components).
