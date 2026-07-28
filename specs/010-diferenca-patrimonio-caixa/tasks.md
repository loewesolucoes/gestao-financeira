# Tasks: Diferença entre patrimônio e saldo no caixa

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Add `TransacoesRepository.saldoAtual()`**
  - `src/app/repositories/transacoes.ts`: new method returning the all-time
    accumulated `SUM(valor)` from `transacoes` as a `BigNumber | undefined`.

- [ ] **T2 — Add `PatrimonioRepository.totalAtual()`**
  - `src/app/repositories/patrimonio.ts`: new method returning
    `{ mes?: string; total?: BigNumber }` for the most recent month present
    in `patrimonio` (or `{}` when the table is empty).

- [ ] **T3 — Build `DiferencaPatrimonioCaixa` shared component**
  - `src/app/components/diferenca-patrimonio-caixa.tsx`: props
    `{ valorPatrimonio?: BigNumber; valorCaixa?: BigNumber }`; renders the
    `card-material-1` card described in `plan.md` (value, extenso, sign
    styling, empty state).

- [ ] **T4 — Component tests**
  - `src/app/components/__tests__/diferenca-patrimonio-caixa.test.tsx`:
    positive diff, negative diff, and undefined `valorPatrimonio` cases.

- [ ] **T5 — Wire `/caixa/page.tsx`**
  - Load `repository.patrimonio.totalAtual()` alongside the existing
    `repository.transacoes.totaisCaixa()` call in `loadTotals()`
    (`Promise.all`); render `<DiferencaPatrimonioCaixa />` in the existing
    top header section next to "Valor em caixa".

- [ ] **T6 — Wire `/patrimonio/page.tsx`**
  - Add a top summary section (new `isDbOk`-driven `useEffect` loading
    `repository.patrimonio.totalAtual()` and
    `repository.transacoes.saldoAtual()` via `Promise.all`, with a
    `Loader` while pending), showing "Patrimônio total" and the shared
    `<DiferencaPatrimonioCaixa />` card, mirroring `/caixa`'s header layout.

- [ ] **T7 — Manual verification**
  - Check `/caixa` and `/patrimonio` with: no `patrimonio` data yet,
    patrimônio > caixa, and patrimônio < caixa; confirm copy/coloring in
    each case and that the período filter does not affect the card's
    values.

- [ ] **T8 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything
    passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Historical chart of the patrimônio-vs-caixa gap over time.
- Configurable threshold/alert on the gap size.
- Repository-level unit tests for `saldoAtual()`/`totalAtual()` (deferred
  to whenever spec `008-testes-unitarios-basicos` lands its
  `DefaultRepository` mocking pattern).
