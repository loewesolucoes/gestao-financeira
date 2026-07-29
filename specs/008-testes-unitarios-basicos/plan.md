# Plan: Testes unitários básicos (utils, repositório padrão, formulários)

Companion technical design for `spec.md`. Since this is test-only work, "data
model"/"migration"/"repository" sections below describe what is being
**tested**, not new schema/repository code.

## Data model
No schema changes. No new tables/columns.

## Migration
No migration needed.

## Repository under test (`src/app/repositories/default.ts`)
No production code changes. `DefaultRepository` is exercised as-is through a
hand-written `IDatabase` mock (`exec`/`export`/`open` as `jest.fn()`), so
tests run fully in-memory without sql.js/Web Worker involvement:

- `save(tableName, data)` — no `id` → `insert()` path (asserts the generated
  `INSERT INTO ... VALUES (...)` command + `$params`, and that
  `LAST_INSERT_ROWID()` result is mapped back into `nextData.id`); with `id`
  → `update()` path (asserts `UPDATE ... SET ... WHERE id=$id` + a follow-up
  `get()` call). Both paths must assert `persistDb()` → `db.export()` is
  invoked (mock `RepositoryUtil.persistLocalDump`/`localforage` at the
  module boundary so no real storage is touched).
- `delete(tableName, id)` — asserts `delete from <table> where id = $id` and
  that persistence runs afterward.
- `list<T>(tableName)` / `get<T>(tableName, id)` — feed a fake
  `initSqlJs.QueryExecResult[]` (`columns`/`values`) through the mocked
  `db.exec` and assert `parseSqlResultToObj` output for each `MapperTypes`
  case: `DATE`, `DATE_TIME` (via `moment`), `NUMBER`, `BOOLEAN`, `IGNORE`
  (field dropped), and the default fallback (numeric column not in the
  mapper → `BigNumber`).
- `parseToCommand` (exercised indirectly via `save`) — assert `Date` values
  serialize via `moment(...).format()` and `BigNumber` values serialize via
  `.toNumber()` in the resulting params object.

## Registering the repository (`src/app/contexts/storage.tsx`)
No new repository to register — existing `DefaultRepository` only.

## Target file layout
```
src/app/
  utils/
    __tests__/
      number.test.ts
      date.test.ts
      enum.test.ts
  repositories/
    __tests__/
      default.test.ts
  metas/
    components/
      __tests__/
        metas-form.test.tsx
  notas/
    components/
      __tests__/
        nota-form.test.tsx
```

## UI design
No new UI. `metas-form.tsx`/`nota-form.tsx` tests reuse the existing
form/modal conventions already implemented in those components (no visual
changes).

## Testing strategy
- `utils/__tests__/number.test.ts` — `NumberUtil.bigNumberToNumber` (nested
  objects with mixed `BigNumber`/plain values), `extenso` (number, `null`,
  `NaN`, `BigNumber` input), `toCurrency`/`toCurrencyAbbreviated` (string,
  number, `BigNumber`, `null`/`NaN`/`Infinity`, k/M/B thresholds),
  `toPercent` (with/without `div`).
- `utils/__tests__/date.test.ts` — `DateUtil.generateGreetings` across the
  four hour bands (mock `moment()`/system time per case, e.g.
  `jest.useFakeTimers().setSystemTime(...)`).
- `utils/__tests__/enum.test.ts` — `EnumUtil.keyFromValue` and
  `EnumUtil.values` against an existing enum (e.g. `TipoDeMeta` from
  `repositories/metas.ts`, or a local test enum).
- `repositories/__tests__/default.test.ts` — as detailed above; mock
  `RepositoryUtil.persistLocalDump`/`localforage` so `persistDb()` doesn't
  touch real storage.
- `metas/components/__tests__/metas-form.test.tsx` and
  `notas/components/__tests__/nota-form.test.tsx` — mirror
  `transacao-form.test.tsx`: mock `useStorage` (`isDbOk`,
  `repository.save`/`delete`, `refresh`), render, assert key pt-br labeled
  fields exist, fill + submit, assert `onCustomSubmit`/`repository.save`
  called.

## Rollout / risk mitigation
1. Land pure `utils` tests first — zero mocking risk, fastest feedback.
2. Land `DefaultRepository` tests next, since the `IDatabase` mock is
   reusable groundwork for any future repository-level tests.
3. Land the two component smoke tests last, copying the proven
   `transacao-form.test.tsx` mocking pattern.
4. Manual verification: run `npm test` locally and confirm all new files
   pass alongside the existing suite; run `npm run lint` to confirm no
   lint regressions.
