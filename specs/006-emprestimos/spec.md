# Spec: Empréstimos (dados e recebidos)

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-27.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/9
Related specs: [001-repository-migrations-refactor](../001-repository-migrations-refactor/spec.md) (new migrations added by this feature should still follow whatever migration mechanism is current at implementation time — inline in `default.ts` if 001 hasn't landed yet, or the new per-repository mechanism if it has), [003-relatorios-ai-chat](../003-relatorios-ai-chat/spec.md) (see "Future ideas" below).

## Problem statement
The `/emprestimos` page is currently a placeholder — it only renders a "página
em construção" message (`src/app/emprestimos/page.tsx`). Users have no way to
record loans: money they **lent to someone** (emprestei) or money they
**borrowed from someone** (peguei emprestado), how much, in how many
installments, who the other person is, and any note about the agreement.
There's also no visibility, from the Home dashboard, of which loan
installments are due in the current month.

### Why this is a problem
- **No loan tracking today** — loans given or taken are a common part of
  personal finances but currently have nowhere to live in the app; users
  would have to track them outside the app (spreadsheet, memory, paper).
- **No installment visibility** — even if a user manually noted a loan
  somewhere, there's no structured way to know which installments are
  due, paid, or still pending, or to see them alongside the rest of their
  monthly financial picture on the Home page.
- **Two distinct directions of money movement** — "money I lent" (an asset,
  I expect to receive) and "money I borrowed" (a liability, I need to pay)
  are conceptually different and must be visually and functionally
  distinguishable, not lumped into a single undifferentiated list.

## Goals
1. Let the user register a loan (`emprestimo`) with: **tipo** (emprestei
   dinheiro a alguém / peguei emprestado de alguém), **pessoa** (free-text
   name of the counterparty), **valor total**, **número de parcelas**, **data
   de início**, and an optional **comentário/nota** (markdown, consistent with
   `metas`/`notas`).
2. Automatically generate the loan's installments (`parcelas`) when it is
   created: `numeroParcelas` monthly installments of equal value
   (`valorTotal / numeroParcelas`), with due dates starting at `dataInicio`
   and spaced one month apart. Each installment is its own record with a due
   date and a "paga/recebida" checkbox — not just an aggregate counter.
3. Let the user mark/unmark each individual installment as
   paga/recebida (checked = money changed hands for that installment), and
   let the user manually edit an individual installment's due date and/or
   value after creation (e.g. to reflect a renegotiated payment date/amount)
   without needing to regenerate the whole loan.
4. Derive the loan's status from its installments: **ativo** (at least one
   unpaid installment) vs **quitado** (all installments paid). Additionally,
   let the user manually **cancelar/arquivar** a loan regardless of its
   installments' paid state (e.g. debt forgiveness, renegotiation into a
   different loan) — a cancelled loan is excluded from "ativo" totals and
   from the Home widget, but remains visible/listed on `/emprestimos` for
   historical reference.
5. Redesign `/emprestimos` to list loans in a clear, scannable way: visually
   distinguish "emprestei" (money to receive) from "peguei emprestado" (money
   to pay), show installment progress (e.g. "2/5 parcelas pagas"), status
   (ativo/quitado/cancelado), and allow creating/editing a loan and its
   installments.
6. Add a new component on the Home page (`/`) showing the current month's
   loan activity: installments due in the selected/current month, split
   between "a receber" (emprestei) and "a pagar" (peguei emprestado), with
   totals for each, excluding cancelled loans.

## Non-goals
- **No automatic integration with Caixa** — marking an installment as
  paid/received does **not** create a corresponding transaction in
  `/caixa` in this iteration; the two modules stay independent for now.
- **No unequal/custom installment amounts at creation time** — the
  installment generator always splits `valorTotal` into
  `numeroParcelas` equal monthly parts; adjusting individual installment
  values afterward (goal 3) is a manual per-installment edit, not a
  creation-time feature.
- **No due-date reminders/notifications** (push notifications, e-mail, etc.)
  for upcoming or overdue installments.
- **No bulk editing** of installments (no multi-select/mass "mark all as
  paid" analogous to `caixa`'s `editar-em-massa.tsx`) in this iteration.
- **No attachments/receipts** (photos, PDFs) tied to a loan or installment.
- **No interest/juros calculation** — installment values are a flat equal
  split of `valorTotal`; no interest accrual, late fees, or amortization
  schedules are computed.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- New tables must be added via the existing migrations mechanism (guarded
  `if (migrations['name'] == null) { ...; migrations['name'] = true }` blocks
  in `runMigrations()` in `src/app/repositories/default.ts`, unless spec
  `001-repository-migrations-refactor` has landed by the time this is
  implemented, in which case the new per-repository migration mechanism
  should be used instead).
- Monetary values must use **`bignumber.js`** (`BigNumber`), and dates must
  use **`moment`**, consistent with every existing repository — no plain
  floats or native `Date` string formatting for persisted data.
- New repository class must extend `DefaultRepository` and be registered in
  `src/app/contexts/storage.tsx` (`Repo` interface + `startStorage()`),
  following the exact pattern already used for `metas`, `notas`,
  `transacoes`, `patrimonio`.
- UI copy must be in **Brazilian Portuguese (pt-br)**, consistent with the
  rest of the app.
- UI must follow existing conventions: Bootstrap 5 + SCSS (`card-material-1`,
  `list-group-item-*` color variants as already used in `metas`/home cash-
  and-goals), the shared `Modal` component for edit dialogs, the shared
  `Input` component for number/date/month/checkbox/markdown fields, and the
  `page.tsx` (thin wrapper) / `page-component.tsx` (or inline logic) +
  `components/` convention already used by other feature routes.
- Since the app is a **statically exported** site with **no strict
  server-side date/timezone handling**, installment due-date generation must
  use the same `moment`-based month arithmetic already used elsewhere in the
  codebase (e.g. `strftime('%Y-%m', ...)` grouping in `transacoes.ts`) to stay
  consistent with how "current month" is computed for the Home dashboard.

## Acceptance criteria
- [ ] Creating a new `emprestimo` (tipo, pessoa, valorTotal, numeroParcelas,
      dataInicio, comentário opcional) persists the loan and automatically
      generates `numeroParcelas` installment records with equal values
      (`valorTotal / numeroParcelas`) and monthly-spaced due dates starting at
      `dataInicio`.
- [ ] Each installment can be individually marked/unmarked as
      paga/recebida, and this is persisted independently per installment.
- [ ] An individual installment's due date and/or value can be edited after
      creation without affecting the other installments of the same loan.
- [ ] A loan's status is correctly derived as **ativo** when it has any
      unpaid installment, and **quitado** when all installments are paid.
- [ ] A loan can be manually cancelled/archived regardless of installment
      state; cancelled loans are excluded from "ativo" totals and from the
      Home widget, but remain visible in the `/emprestimos` listing.
- [ ] `/emprestimos` clearly visually distinguishes "emprestei" (a receber)
      from "peguei emprestado" (a pagar), shows installment progress and
      status per loan, and supports creating/editing loans and their
      installments.
- [ ] The Home page shows a new component listing the current month's
      installments due, split into "a receber" and "a pagar" totals,
      excluding cancelled loans.
- [ ] `npm run lint` and `npm test` (including new tests for the repository
      and the new components) pass once implemented.

## Future ideas (documented only — not implemented by this spec)
These are explicitly **out of scope** for this spec's acceptance criteria,
dependencies, and code changes. They're captured here so they aren't lost,
to be picked up as separate future specs if desired:

1. **Chat de IA enxergando empréstimos** — extend the read-only table
   allowlist used by the `/relatorios` AI chat (see
   [003-relatorios-ai-chat](../003-relatorios-ai-chat/spec.md)) to also
   include `emprestimos` and `emprestimo_parcelas`, so the user could ask
   natural-language questions like "quanto tenho a receber esse mês?" or
   "quem me deve dinheiro?" and get answers grounded in this new data.
2. **Cadastro rápido por texto livre com IA** — a free-text field on the
   loan creation form where the user types something like "Emprestei 600
   pro João em 3x a partir de agosto" and the same Gemini integration used
   in spec 003 extracts structured fields (`tipo`, `pessoa`, `valorTotal`,
   `numeroParcelas`, `dataInicio`) to pre-fill the form, reducing manual
   field-by-field entry.

Neither idea introduces any AI-related dependency, table-allowlist change,
or UI element in the current spec — they are purely notes for potential
future work.
