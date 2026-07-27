# Plan: Empréstimos (dados e recebidos)

Companion technical design for `spec.md`. Describes the target data model,
repository methods, file layout, and testing strategy for the `/emprestimos`
feature and its Home widget.

## Data model — two new tables

### `emprestimos`
| column          | type     | notes                                                                 |
|-----------------|----------|------------------------------------------------------------------------|
| id              | INTEGER  | PK                                                                     |
| tipo            | INTEGER  | `TipoDeEmprestimo.EMPRESTEI = 0` (a receber) / `TOMEI_EMPRESTADO = 1` (a pagar) |
| pessoa          | TEXT     | free-text name of the counterparty                                    |
| valorTotal      | REAL     | `BigNumber`-mapped, total value of the loan                           |
| numeroParcelas  | INTEGER  | number of installments generated at creation                          |
| dataInicio      | DATETIME | due date of the first installment                                     |
| comentario      | TEXT     | optional markdown note, rendered like `metas`/`notas`                 |
| cancelado       | INTEGER  | boolean (0/1), manual cancel/archive flag, independent of parcelas    |
| createdDate     | DATETIME | standard `DefaultFields`                                              |
| updatedDate     | DATETIME | standard `DefaultFields`                                              |

### `emprestimo_parcelas`
| column          | type     | notes                                                                 |
|-----------------|----------|------------------------------------------------------------------------|
| id              | INTEGER  | PK                                                                     |
| emprestimoId    | INTEGER  | FK → `emprestimos.id`                                                 |
| numero          | INTEGER  | 1-based installment index within the loan                             |
| valor           | REAL     | `BigNumber`-mapped, this installment's value (editable individually)  |
| dataVencimento  | DATETIME | due date (editable individually)                                     |
| pago            | INTEGER  | boolean (0/1), paga/recebida checkbox                                 |
| dataPagamento   | DATETIME | nullable, set when `pago` is marked true                              |
| createdDate     | DATETIME | standard `DefaultFields`                                              |
| updatedDate     | DATETIME | standard `DefaultFields`                                              |

Both tables follow the existing `DEFAULT_MAPPING` convention
(`createdDate`/`updatedDate` as `MapperTypes.DATE_TIME`), plus:
`tipo: MapperTypes.NUMBER`, `numeroParcelas: MapperTypes.NUMBER`,
`dataInicio`/`dataVencimento`/`dataPagamento`: `MapperTypes.DATE_TIME`,
`cancelado`/`pago`: `MapperTypes.BOOLEAN`, `emprestimoId`/`numero`:
`MapperTypes.NUMBER`.

## Migration
Add two guarded blocks to `runMigrations()` in `src/app/repositories/default.ts`
(same pattern as the existing `metas`/`categoria_transacoes` blocks), in this
order (parcelas after emprestimos, since it has a FK):

```ts
if (migrations['emprestimos'] == null) {
  await this.db.exec(`CREATE TABLE IF NOT EXISTS "emprestimos" ("id" INTEGER NOT NULL,"tipo" INTEGER NOT NULL,"pessoa" TEXT NULL DEFAULT NULL,"valorTotal" REAL NULL DEFAULT NULL,"numeroParcelas" INTEGER NULL DEFAULT NULL,"dataInicio" DATETIME NOT NULL,"comentario" TEXT NULL DEFAULT NULL,"cancelado" INTEGER NULL DEFAULT 0,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));`);
  migrations['emprestimos'] = RUNNED_MIGRATION_CODE;
}

if (migrations['emprestimo_parcelas'] == null) {
  await this.db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE IF NOT EXISTS "emprestimo_parcelas" ("id" INTEGER NOT NULL,"emprestimoId" INTEGER NOT NULL REFERENCES "emprestimos" ("id"),"numero" INTEGER NOT NULL,"valor" REAL NULL DEFAULT NULL,"dataVencimento" DATETIME NOT NULL,"pago" INTEGER NULL DEFAULT 0,"dataPagamento" DATETIME NULL DEFAULT NULL,"createdDate" DATETIME NOT NULL,"updatedDate" DATETIME NULL DEFAULT NULL,PRIMARY KEY ("id"));
    PRAGMA foreign_keys = ON;
  `.trim());
  migrations['emprestimo_parcelas'] = RUNNED_MIGRATION_CODE;
}
```

If `001-repository-migrations-refactor` has landed by implementation time,
these two blocks should instead become `.sql` files colocated with the new
`emprestimos.ts` repository, registered in the ordered manifest that refactor
introduces — same SQL, just relocated.

Also add `EMPRESTIMOS = "emprestimos"` and
`EMPRESTIMO_PARCELAS = "emprestimo_parcelas"` to the `TableNames` enum in
`default.ts`.

## Repository (`src/app/repositories/emprestimos.ts`)

```ts
export interface Emprestimos extends DefaultFields {
  tipo: TipoDeEmprestimo
  pessoa?: string
  valorTotal?: BigNumber
  numeroParcelas?: number
  dataInicio: Date
  comentario?: string
  cancelado?: boolean
}

export enum TipoDeEmprestimo {
  EMPRESTEI = 0,       // a receber
  TOMEI_EMPRESTADO = 1 // a pagar
}

export interface EmprestimoParcelas extends DefaultFields {
  emprestimoId: number
  numero: number
  valor?: BigNumber
  dataVencimento: Date
  pago?: boolean
  dataPagamento?: Date
}

export interface EmprestimoComParcelas extends Emprestimos {
  parcelas: EmprestimoParcelas[]
  status: StatusEmprestimo // derived, not persisted
}

export enum StatusEmprestimo {
  ATIVO = 'ativo',
  QUITADO = 'quitado',
  CANCELADO = 'cancelado',
}

export class EmprestimosRepository extends DefaultRepository {
  // @ts-ignore
  public readonly DEFAULT_MAPPING = { ...DEFAULT_MAPPING, tipo: MapperTypes.NUMBER, numeroParcelas: MapperTypes.NUMBER, dataInicio: MapperTypes.DATE_TIME, cancelado: MapperTypes.BOOLEAN };
  public readonly PARCELAS_MAPPING = { ...DEFAULT_MAPPING, emprestimoId: MapperTypes.NUMBER, numero: MapperTypes.NUMBER, dataVencimento: MapperTypes.DATE_TIME, pago: MapperTypes.BOOLEAN, dataPagamento: MapperTypes.DATE_TIME };

  // Inserts the emprestimo row + N generated parcelas rows in a single
  // transaction, mirroring the multi-statement transaction pattern already
  // used by DefaultRepository.saveAll().
  public async criarComParcelas(data: Omit<Emprestimos, 'id' | 'createdDate'>): Promise<EmprestimoComParcelas> { /* ... */ }

  // Lists all emprestimos with their parcelas joined/aggregated, and the
  // derived `status` computed from parcelas.pago + cancelado.
  public async listComParcelas(): Promise<EmprestimoComParcelas[]> { /* ... */ }

  // Toggles a single parcela's `pago` (and sets/clears `dataPagamento`).
  public async marcarParcelaPaga(parcelaId: number, pago: boolean): Promise<EmprestimoParcelas> { /* ... */ }

  // Updates a single parcela's `valor` and/or `dataVencimento` in isolation.
  public async editarParcela(parcelaId: number, data: Partial<Pick<EmprestimoParcelas, 'valor' | 'dataVencimento'>>): Promise<EmprestimoParcelas> { /* ... */ }

  // Sets `cancelado = true` on the emprestimo (does not touch parcelas).
  public async cancelar(emprestimoId: number): Promise<Emprestimos> { /* ... */ }

  // Used by the Home widget: sums parcelas due in the given month, grouped
  // by tipo, excluding emprestimos where cancelado = true.
  public async totaisDoMes(yearAndMonth: Date): Promise<TotaisEmprestimosDoMes> { /* ... */ }
}

export interface TotaisEmprestimosDoMes {
  aReceber: BigNumber       // sum of EMPRESTEI parcelas due this month
  aPagar: BigNumber         // sum of TOMEI_EMPRESTADO parcelas due this month
  parcelasDoMes: (EmprestimoParcelas & { pessoa?: string; tipo: TipoDeEmprestimo })[]
}
```

Status derivation logic (used both in `listComParcelas()` and any place that
needs it):
```
if (emprestimo.cancelado) -> CANCELADO
else if (parcelas.some(p => !p.pago)) -> ATIVO
else -> QUITADO
```

Installment generation logic (used by `criarComParcelas()`):
```
valorParcela = BigNumber(valorTotal).dividedBy(numeroParcelas)  // equal split
for i in 0..numeroParcelas-1:
  parcela.numero = i + 1
  parcela.valor = valorParcela
  parcela.dataVencimento = moment(dataInicio).add(i, 'months').toDate()
  parcela.pago = false
```
(Standard equal split; any remainder-cents rounding, if it ever matters,
would be absorbed into the last installment — noted here for the
implementer, not a hard requirement since `BigNumber` division precision is
generally acceptable for this app's existing tolerance level.)

## Registering the repository (`src/app/contexts/storage.tsx`)
- Add `emprestimos: EmprestimosRepository` to the `Repo` interface.
- In `startStorage()`: `repository.emprestimos = new EmprestimosRepository(sqldb);`
  — same one-line pattern as `metas`/`notas`/`patrimonio`.

## Target file layout

```
src/app/
  repositories/
    emprestimos.ts                        # new: EmprestimosRepository + types
    default.ts                            # updated: 2 new migrations, 2 new TableNames
  contexts/
    storage.tsx                           # updated: register EmprestimosRepository
  emprestimos/
    page.tsx                              # updated: replace placeholder with real listing
    page.scss                             # updated: loan card / progress styles
    components/
      emprestimo-form.tsx                 # new: create/edit modal (tipo, pessoa, valor, parcelas, data, comentário, cancelar)
      emprestimo-parcelas.tsx             # new: parcelas list with pago checkbox + inline edit of valor/dataVencimento
      __tests__/
        emprestimo-form.test.tsx
        emprestimo-parcelas.test.tsx
  home/
    page-component.tsx                    # updated: render <EmprestimosDoMes />
    components/
      emprestimos-do-mes.tsx              # new: Home widget (a receber / a pagar totals + list for current month)
      __tests__/
        emprestimos-do-mes.test.tsx
```

## `/emprestimos` page design
Following the `metas/page.tsx` pattern (list grouped + modal for edit) rather
than `caixa`'s month-navigation pattern, since loans span multiple months by
nature:
- Header with "Novo empréstimo" button opening `<EmprestimoForm />` in a
  `<Modal>` (same as `metas-form.tsx`/`MetasForm`).
- List of loans as cards/list-group items, colored by `tipo`
  (`list-group-item-success` for **emprestei**/a receber,
  `list-group-item-warning` for **tomei emprestado**/a pagar — mirroring the
  existing `TipoDeMeta` color convention in `metas`), with a muted/greyed
  style for `cancelado` loans.
- Each item shows: `pessoa`, `valorTotal` (formatted via `NumberUtil.toCurrency`),
  installment progress (`{pagas}/{numeroParcelas} parcelas pagas`), status
  badge (Ativo/Quitado/Cancelado), rendered `comentario` (via
  `MarkdownUtils.render`, same as `metas`), and an "Editar" button opening
  the same `<EmprestimoForm />` pre-filled plus the `<EmprestimoParcelas />`
  list for that loan (checkbox per installment + inline edit of
  `valor`/`dataVencimento`), and a "Cancelar empréstimo" action when not
  already cancelled/quitado.
- Optional grouping/sorting: active loans first, then quitados, then
  cancelados (exact grouping left to implementation, but cancelados should
  not be the first thing the user sees).

## Home widget (`home/components/emprestimos-do-mes.tsx`)
- Props: `yearAndMonth: Date` (reuse the same month state already in
  `page-component.tsx`, alongside `HomeCashAndGoals`).
- Calls `repository.emprestimos.totaisDoMes(yearAndMonth)`.
- Renders a `card card-material-1` with two sub-sections: "A receber este
  mês" (sum + count of EMPRESTEI parcelas due) and "A pagar este mês" (sum +
  count of TOMEI_EMPRESTADO parcelas due), each using `NumberUtil.toCurrency`
  /`NumberUtil.extenso` like `HomeCashAndGoals` does for `valorEmCaixa`.
- Empty state: `alert alert-info` "Nenhuma parcela de empréstimo neste mês."
  when both lists are empty, consistent with the empty-state pattern already
  used in `HomeCashAndGoals`'s metas list and `MetasPage`.
- Placed in `page-component.tsx` alongside/after `<HomeCashAndGoals />`.

## Testing strategy
- `repositories/__tests__/emprestimos.test.ts` (new, if a precedent for
  repository-level tests exists at implementation time, otherwise tested
  indirectly through component tests mocking `useStorage`): installment
  generation (equal split + monthly spacing), status derivation
  (ativo/quitado/cancelado), `marcarParcelaPaga` toggling, `cancelar`,
  `totaisDoMes` grouping/summing and exclusion of cancelled loans.
- `emprestimos/components/__tests__/emprestimo-form.test.tsx`: mock
  `useStorage`; assert required fields validation, assert submit calls
  `criarComParcelas`/`save` with the right shape, assert the "Cancelar
  empréstimo" button only appears when editing an existing non-cancelled
  loan.
- `emprestimos/components/__tests__/emprestimo-parcelas.test.tsx`: mock
  `useStorage`; assert checkbox toggling calls `marcarParcelaPaga`, assert
  inline edit of `valor`/`dataVencimento` calls `editarParcela`.
- `home/components/__tests__/emprestimos-do-mes.test.tsx`: mock `useStorage`;
  assert totals render correctly for a given month, assert the empty state
  renders when there are no parcelas due, assert cancelled loans are excluded.

## Rollout / risk mitigation
1. Land the migration + repository (`emprestimos.ts`) and its tests first —
   it's fully unit-testable without any UI dependency.
2. Build the `/emprestimos` page and its form/parcelas components next,
   reusing `metas`' modal/list-group patterns as closely as possible to
   minimize new UI conventions.
3. Add the Home widget last, since it only needs `totaisDoMes()` which will
   already be tested by that point.
4. Manually verify: create a loan of each `tipo`, confirm parcelas are
   generated correctly, mark parcelas paid/unpaid, edit an individual
   parcela, cancel a loan, and confirm the Home widget totals update and
   exclude the cancelled loan — before considering the feature done.
