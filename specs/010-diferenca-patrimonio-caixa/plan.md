# Plan: Diferença entre patrimônio e saldo no caixa

Companion technical design for `spec.md`. Describes the target data model,
repository methods, file layout, and testing strategy.

## Data model
No schema changes.

## Migration
No migration needed.

## Repository changes
### `src/app/repositories/transacoes.ts` (`TransacoesRepository`)
- Add `saldoAtual(): Promise<BigNumber | undefined>` — lightweight query
  reusing the same logic as `totaisCaixa()`'s first `SELECT SUM(t.valor) as
  valorEmCaixa FROM transacoes t` (without the per-month accumulation
  query), so callers that only need the total (e.g. `/patrimonio`) don't
  pay for the unused `transacoesAcumuladaPorMes` computation.

### `src/app/repositories/patrimonio.ts` (`PatrimonioRepository`)
- Add `totalAtual(): Promise<{ mes?: string; total?: BigNumber }>` —
  `SELECT strftime('%Y-%m', data) AS mes, SUM(valor) AS total FROM
  patrimonio GROUP BY mes ORDER BY mes DESC LIMIT 1`, returning `{}`
  (undefined fields) when there are no `patrimonio` rows yet.

## Registering the repository (`src/app/contexts/storage.tsx`)
No new repository to register — both `transacoes` and `patrimonio`
repositories already exist there; only new methods are added to each.

## Target file layout
```
src/app/
  repositories/
    transacoes.ts        (+ saldoAtual())
    patrimonio.ts         (+ totalAtual())
  components/
    diferenca-patrimonio-caixa.tsx
    __tests__/
      diferenca-patrimonio-caixa.test.tsx
  caixa/
    page.tsx              (loads both totals, renders new card)
  patrimonio/
    page.tsx               (adds a top summary section; loads both totals,
                            renders new card)
```

## New component: `src/app/components/diferenca-patrimonio-caixa.tsx`
- Placed in the shared `src/app/components/` folder (not `caixa/components/`)
  since it is rendered from two different feature pages, mirroring how
  `general-chart.tsx`/`loader.tsx` are shared.
- Props: `{ valorPatrimonio?: BigNumber; valorCaixa?: BigNumber }`.
- Renders a `card card-material-1` (same visual family as "Balanço do mês"):
  - Title: `Diferença entre patrimônio e caixa`.
  - If `valorPatrimonio` is `undefined` (no `patrimonio` rows registered
    yet): render the existing `alert alert-info` empty-state pattern used
    elsewhere in the app (e.g. `GraficoMesPorCategoria`'s "Nenhuma ...
    encontrada."), text: `Nenhum patrimônio registrado ainda.`
  - Otherwise compute `diferenca = valorPatrimonio - (valorCaixa ?? 0)` with
    `BigNumber`, and render:
    - `NumberUtil.toCurrency(diferenca)` value, styled `text-success` when
      `diferenca.isGreaterThanOrEqualTo(0)` and `text-danger` otherwise
      (consistent with other positive/negative amount conventions already
      used in `NumberUtil`/existing cards).
    - `<small>` with `NumberUtil.extenso(diferenca, ...)`.
    - A one-line explanatory `<small>` noting which side is higher, e.g.
      `Patrimônio acima do saldo em caixa` / `Patrimônio abaixo do saldo em
      caixa`, in pt-br.

## Page wiring
### `src/app/caixa/page.tsx`
- Already loads `valorEmCaixa` via `repository.transacoes.totaisCaixa()` in
  `loadTotals()`.
- Add a call to `repository.patrimonio.totalAtual()` in the same
  `loadTotals()` (parallelized with `Promise.all`), store
  `valorPatrimonioAtual` in state.
- Render `<DiferencaPatrimonioCaixa valorPatrimonio={valorPatrimonioAtual}
  valorCaixa={valorEmCaixa} />` in the existing top `<section
  className="d-flex justify-content-between ...">` header, alongside "Valor
  em caixa".

### `src/app/patrimonio/page.tsx`
- Currently has no data-loading/top-summary section at all (only `<h1>`).
  Add one, mirroring `/caixa`'s pattern:
  - New `isLoading`/`valorPatrimonioAtual`/`valorEmCaixa` state,
    `useEffect` on `isDbOk` calling `repository.patrimonio.totalAtual()`
    and `repository.transacoes.saldoAtual()` (via `Promise.all`).
  - New header `<section>` above `<article className="transacoes">`,
    showing "Patrimônio total: R$ X" (from `totalAtual()`) plus the shared
    `<DiferencaPatrimonioCaixa />` card, using the same `Loader` pattern as
    `/caixa` while loading.

## Testing strategy
- `src/app/components/__tests__/diferenca-patrimonio-caixa.test.tsx`: pure
  component test (no `useStorage` needed — props only), covering:
  - Positive difference → `text-success` + "acima" copy.
  - Negative difference → `text-danger` + "abaixo" copy.
  - `valorPatrimonio` undefined → empty-state alert, no crash.
- No repository unit test suite currently exists for
  `transacoes.ts`/`patrimonio.ts` (see spec `008-testes-unitarios-basicos`,
  still `Draft`); this spec does not introduce one on its own — new
  repository methods (`saldoAtual`, `totalAtual`) will be covered only via
  the manual verification checklist in `tasks.md`, consistent with the rest
  of the codebase's current test coverage. If `008` lands first, its
  `DefaultRepository`-mocking pattern should be reused for these methods
  too.

## Rollout / risk mitigation
1. Add the two repository methods first (small, isolated, easy to sanity
   check against the sql.js console/manual testing).
2. Build the shared `DiferencaPatrimonioCaixa` component + its test next
   (pure props-in component, fully unit-testable in isolation).
3. Wire `/caixa/page.tsx` (smaller change, existing header section).
4. Wire `/patrimonio/page.tsx` (larger change, needs a new header section).
5. Manual verification: check both pages with (a) no patrimônio data, (b)
   patrimônio > caixa, (c) patrimônio < caixa, confirming styling/copy in
   each case.
