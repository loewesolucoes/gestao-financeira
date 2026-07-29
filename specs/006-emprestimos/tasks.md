# Tasks: Empréstimos (dados e recebidos)

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Add `emprestimos` and `emprestimo_parcelas` tables**
  - In `src/app/repositories/default.ts`, add `EMPRESTIMOS = "emprestimos"`
    and `EMPRESTIMO_PARCELAS = "emprestimo_parcelas"` to the `TableNames`
    enum.
  - Add two guarded migration blocks to `runMigrations()` (see `plan.md` for
    the exact SQL), `emprestimos` before `emprestimo_parcelas` (FK order).
  - If `001-repository-migrations-refactor` has landed by now, use its new
    per-repository migration mechanism instead, with the same SQL/migration
    names (so existing local DBs don't re-run anything).

- [ ] **T2 — Build `EmprestimosRepository`**
  - Create `src/app/repositories/emprestimos.ts` with `Emprestimos`,
    `TipoDeEmprestimo`, `EmprestimoParcelas`, `EmprestimoComParcelas`,
    `StatusEmprestimo`, `TotaisEmprestimosDoMes` types, and
    `EmprestimosRepository extends DefaultRepository`.
  - Implement `criarComParcelas()`: single transaction inserting the
    `emprestimos` row plus `numeroParcelas` generated `emprestimo_parcelas`
    rows (equal split of `valorTotal`, monthly-spaced `dataVencimento`
    starting at `dataInicio`), following the multi-statement transaction
    pattern already used by `DefaultRepository.saveAll()`.
  - Implement `listComParcelas()`: joins/aggregates parcelas per emprestimo
    and computes the derived `status` (ativo/quitado/cancelado).
  - Implement `marcarParcelaPaga(parcelaId, pago)`, `editarParcela(parcelaId,
    { valor?, dataVencimento? })`, `cancelar(emprestimoId)`.
  - Implement `totaisDoMes(yearAndMonth)`: sums parcelas due in the given
    month grouped by `tipo`, excluding `cancelado` loans.

- [ ] **T3 — Repository unit tests**
  - Add tests covering: installment generation (equal split + monthly
    spacing, including an edge case like `valorTotal` not evenly divisible
    by `numeroParcelas`), status derivation for all three states, toggling
    `marcarParcelaPaga`, `editarParcela` updating a single installment
    without affecting siblings, `cancelar`, and `totaisDoMes` correctly
    summing/grouping and excluding cancelled loans.

- [ ] **T4 — Register the repository**
  - Update `src/app/contexts/storage.tsx`: add `emprestimos:
    EmprestimosRepository` to the `Repo` interface and instantiate it in
    `startStorage()`, same one-line pattern as `metas`/`notas`/`patrimonio`.

- [ ] **T5 — Build `emprestimo-form.tsx`**
  - Create `src/app/emprestimos/components/emprestimo-form.tsx`: fields for
    `tipo` (select: "Emprestei dinheiro" / "Peguei emprestado"), `pessoa`
    (text), `valorTotal` (currency `Input`), `numeroParcelas` (number
    `Input`), `dataInicio` (date/month `Input`), `comentario` (markdown
    textarea, reusing `md-text-area.tsx`/`MarkdownUtils` like `metas-form.tsx`).
  - On submit (create mode): call `repository.emprestimos.criarComParcelas()`.
  - Accept an optional `emprestimo` prop for edit mode (following
    `metas-form.tsx`'s `cleanStyle`/`onClose` prop shape); when editing, show
    a "Cancelar empréstimo" button (calls `cancelar()`) if not already
    cancelado/quitado.

- [ ] **T6 — Build `emprestimo-parcelas.tsx`**
  - Create `src/app/emprestimos/components/emprestimo-parcelas.tsx`: renders
    the list of `EmprestimoParcelas` for a given loan, each with a checkbox
    (calls `marcarParcelaPaga`) and inline-editable `valor`/`dataVencimento`
    (calls `editarParcela`).

- [ ] **T7 — Component tests for form and parcelas list**
  - `emprestimos/components/__tests__/emprestimo-form.test.tsx`: mock
    `useStorage`; validate required fields, assert `criarComParcelas` is
    called with the right shape on submit, assert "Cancelar empréstimo"
    visibility rules.
  - `emprestimos/components/__tests__/emprestimo-parcelas.test.tsx`: mock
    `useStorage`; assert checkbox toggling and inline edits call the right
    repository methods.

- [ ] **T8 — Rebuild the `/emprestimos` page**
  - Replace the placeholder in `src/app/emprestimos/page.tsx` with a real
    listing (via `repository.emprestimos.listComParcelas()`): "Novo
    empréstimo" button + `<EmprestimoForm />` in a `<Modal>`, loans grouped/
    colored by `tipo` (success = a receber, warning = a pagar), showing
    installment progress and status, cancelados visually de-emphasized, and
    an "Editar" flow opening `<EmprestimoForm />` + `<EmprestimoParcelas />`
    for the selected loan.
  - Update `src/app/emprestimos/page.scss` with any new styles needed
    (progress indicator, cancelado styling).

- [ ] **T9 — Build the Home widget**
  - Create `src/app/home/components/emprestimos-do-mes.tsx`: calls
    `repository.emprestimos.totaisDoMes(yearAndMonth)`, renders "A receber
    este mês" / "A pagar este mês" totals (via `NumberUtil.toCurrency`/
    `extenso`) plus an empty-state alert when there's nothing due.
  - Wire it into `src/app/home/page-component.tsx`, placed alongside/after
    `<HomeCashAndGoals />`.

- [ ] **T10 — Home widget test**
  - `home/components/__tests__/emprestimos-do-mes.test.tsx`: mock
    `useStorage`; assert totals render for a given month, assert empty
    state, assert cancelled loans are excluded from totals.

- [ ] **T11 — Manual verification**
  - Create one loan of each `tipo` and confirm parcelas are generated with
    correct values/dates.
  - Mark and unmark parcelas as paid/received; confirm the loan's derived
    status updates (ativo → quitado when all are paid).
  - Edit a single parcela's `valor`/`dataVencimento` and confirm siblings are
    unaffected.
  - Cancel a loan and confirm it's excluded from the Home widget's totals
    but still visible (de-emphasized) on `/emprestimos`.
  - Confirm the Home widget's current-month totals match the sum of the
    relevant parcelas.

- [ ] **T12 — Lint/build/test gate**
  - Run `npm run lint` and `npm test` (full suite) and confirm everything
    passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Automatic Caixa transaction creation when a parcela is marked paid/recebida.
- Due-date reminders/notifications for upcoming or overdue parcelas.
- Bulk/mass editing of parcelas (analogous to `caixa`'s `editar-em-massa.tsx`).
- Attachments/receipts tied to a loan or parcela.
- Interest/juros calculation, late fees, or amortization schedules.
- **AI-related ideas** (see `spec.md`'s "Future ideas" section): extending
  the `/relatorios` AI chat's table allowlist to include `emprestimos`/
  `emprestimo_parcelas`, and a free-text "cadastro rápido" field using Gemini
  to pre-fill the loan form. No AI dependency, prompt, or UI element is part
  of this task list.
