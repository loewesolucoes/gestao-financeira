# Tasks: Testes unitários básicos (utils, repositório padrão, formulários)

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [x] **T1 — `NumberUtil` unit tests**
  - `src/app/utils/__tests__/number.test.ts`: `bigNumberToNumber`,
    `extenso`, `toCurrency`, `toCurrencyAbbreviated` (k/M/B thresholds),
    `toPercent` (with/without `div`); include `null`/`NaN`/`Infinity`/string
    input edge cases.

- [x] **T2 — `DateUtil` unit tests**
  - `src/app/utils/__tests__/date.test.ts`: `generateGreetings` across the
    4 hour bands, using fake timers to control the current hour.

- [x] **T3 — `EnumUtil` unit tests**
  - `src/app/utils/__tests__/enum.test.ts`: `keyFromValue` and `values`
    against an existing numeric enum (e.g. `TipoDeMeta`).

- [x] **T4 — `DefaultRepository` unit tests**
  - `src/app/repositories/__tests__/default.test.ts`: build a mocked
    `IDatabase` (`exec`/`export`/`open` as `jest.fn()`) and mock
    `RepositoryUtil.persistLocalDump` (and/or `localforage`) so
    `persistDb()` never touches real storage.
  - Cover `save` (insert path: no `id`; update path: with `id`, asserts a
    follow-up `get()`), `delete`, `list`, `get`.
  - Cover `parseSqlResultToObj` mapping for every `MapperTypes` case
    (`DATE`, `DATE_TIME`, `NUMBER`, `BOOLEAN`, `IGNORE`, default `BigNumber`
    fallback) using fake `initSqlJs.QueryExecResult[]` fixtures.
  - Cover `parseToCommand` `Date`→`moment().format()` and
    `BigNumber`→`.toNumber()` serialization (via the `save` insert/update
    assertions on `params`).

- [x] **T5 — `metas-form.tsx` smoke test**
  - `src/app/metas/components/__tests__/metas-form.test.tsx`, mirroring
    `transacao-form.test.tsx`: mock `useStorage`, render, assert key pt-br
    fields, fill + submit, assert save/submit callback invoked.

- [x] **T6 — `nota-form.tsx` smoke test**
  - `src/app/notas/components/__tests__/nota-form.test.tsx`, same pattern
    as T5.

- [x] **T7 — Manual verification**
  - Run `npm test` locally; confirm all new test files pass alongside the
    existing suite (no flakiness from fake timers/mocks leaking between
    tests).

- [x] **T8 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything
    passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Unit tests for `RepositoryUtil` (localforage persistence, base64/Blob
  dump parsing).
- Tests for `database-connector.ts` (mocked `Worker`/`BroadcastChannel`).
- Smoke tests for remaining feature components (`caixa`, `patrimonio`,
  `emprestimos`, `relatorios`, `home`).
- End-to-end/browser-level tests — tracked separately by spec
  `004-e2e-smoke-tests-playwright`.
