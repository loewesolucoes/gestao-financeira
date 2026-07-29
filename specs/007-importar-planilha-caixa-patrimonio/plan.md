# Plan: Importar Caixa/Patrimônio via planilha (CSV/Excel)

Companion technical design for `spec.md`.

## Data model
No schema changes. This feature only produces rows shaped like the existing
`Transacoes` (`src/app/repositories/transacoes.ts`) and `Patrimonio`
(`src/app/repositories/patrimonio.ts`) interfaces, persisted through the
existing tables (`transacoes` / `patrimonio`).

Internal (in-memory only, not persisted) shape used while importing:

| field | type | notes |
|---|---|---|
| `rowIndex` | number | original row number in the file, for error messages |
| `raw` | Record<string, any> | original parsed cell values for that row |
| `parsed` | `Partial<Transacoes \| Patrimonio>` | mapped/typed values |
| `status` | `'valido' \| 'invalido' \| 'aviso-duplicado'` | preview status |
| `erros` | string[] | human-readable reasons when `invalido` |

## Migration
No migration needed.

## Library choice
- **`xlsx`** (SheetJS Community Edition) — parses `.xlsx`, `.xls`, and
  `.csv` with a single `read`/`utils.sheet_to_json` API, and can also
  *generate* files (`utils.json_to_sheet` + `writeFile`), so the same
  dependency covers both parsing the user's file and generating the
  downloadable template — no need for a second library (e.g. papaparse) just
  for CSV.
- Add to `package.json` `dependencies` (not dev) since it's used at runtime,
  but **never statically imported** from `page.tsx`/module scope. It must
  only be loaded with `const XLSX = await import('xlsx')` inside the click
  handler that opens the import modal (or the parse function itself), so it
  is split into its own chunk and fetched on demand — consistent with the
  "goal 7 / lazy-load" constraint in `spec.md`.
- Template generation can reuse the same lazily-imported module (generate a
  `.xlsx` with `XLSX.utils.book_new()` + one example row) — triggered by the
  "Baixar modelo" button, also lazy-loaded.

## Repository
No new/changed repository methods. Import uses the existing:
- `repository.categoriaTransacoes.TODAS` / `TODAS_DICT` (already loaded at
  startup) for category name matching (caixa only).
- `repository.transacoes.listCaixa(PeriodoTransacoes.TODO_HISTORICO)` /
  `repository.patrimonio.listPatrimonio(PeriodoTransacoes.TODO_HISTORICO)`
  to fetch existing records for duplicate-detection comparison before
  showing the preview (small, in-memory data set — same pattern already
  used elsewhere, e.g. `listCaixa`/`listPatrimonio`).
- `repository.saveAll(tableName, items)` to persist all valid rows in one
  transaction (already batches inserts — see `DefaultRepository.saveAll` in
  `default.ts`).

## Component API
`ImportarPlanilha` mirrors `TransacaoForm`'s `onCustomSubmit` pattern so it
can be reused in both "persist immediately" and "stage in memory" contexts:

```ts
interface ImportarPlanilhaProps {
  tableName?: TableNames
  // When provided (used by EditarEmMassa), the component does NOT call
  // repository.saveAll itself — it calls this once per valid row (or once
  // with the full array) so the caller stages rows into its own in-memory
  // list, exactly like TransacaoForm's onCustomSubmit does for a single
  // manually-added row. When omitted (used directly on /caixa and
  // /patrimonio), the component persists via repository.saveAll + refresh()
  // + NotificationUtil.send(...) itself.
  onCustomImport?: (rows: (Transacoes | Patrimonio)[]) => void
}
```

## Registering the repository (`src/app/contexts/storage.tsx`)
No new repository to register — this feature is UI + a parsing/mapping
utility module only.

## Target file layout
```
src/app/
  caixa/
    components/
      importar-planilha.tsx        # shared button + modal, tableName + onCustomImport props
      __tests__/
        importar-planilha.test.tsx
  utils/
    planilha-import.ts              # pure parsing/mapping/validation helpers (no React), unit-testable without mocking sql.js
    __tests__/
      planilha-import.test.ts
```
`ImportarPlanilha` is placed in `caixa/components/` (like `TransacaoForm`,
`EditarEmMassa`) and imported from `patrimonio/page.tsx`, `editar-mes/`, and
`copia/` pages of both features, following the existing pattern of sharing
caixa components via a `tableName?: TableNames` prop.

## Column mapping & recognized headers
`utils/planilha-import.ts` exports a header-normalization function
(lowercase, strip accents/whitespace) and a per-table header dictionary,
e.g.:
- Caixa: `data`/`dia` → `data`; `valor`/`valor (r$)` → `valor`;
  `local`/`descricao`/`descrição` → `local`; `categoria` → `categoria`
  (resolved to `categoriaId` via `TODAS`/`TODAS_DICT` fuzzy match, else
  default category id); `tipo` → `tipo` (`"fixo"` → `TipoDeReceita.FIXO`,
  else `VARIAVEL`); `comentario`/`comentário`/`obs` → `comentario`.
- Patrimônio: `data`; `valor`; `local`/`descricao`; `comentario`/`obs`.
Unrecognized extra columns are ignored (not an error). Missing required
columns (`data`, `valor`) → the whole file is rejected upfront with a clear
message before any row parsing.

## Validation & duplicate detection rules
- Row invalid when `data` fails to parse (accepts common formats via
  `moment(value, ['DD/MM/YYYY','YYYY-MM-DD', ...])`) or `valor` isn't
  numeric (accepts comma or dot decimal separators, optional `R$`/thousands
  separators).
- Duplicate warning (non-blocking): existing record in the same table with
  the same `data` (day precision) and same `valor`, and `local` matching
  case/accent-insensitively (or both blank).
- Category fallback: unmatched/absent `categoria` text resolves silently to
  the first category flagged as default (or id `1`, "Outros", seeded by the
  `categoria_transacoes` migration in `default.ts`).

## UI design
Modal-driven wizard, opened from a new **"Importar planilha"** button placed:
- in the `forms` column next to `TransacaoForm` on both `/caixa`
  (`caixa/page.tsx`) and `/patrimonio` (`patrimonio/page.tsx`);
- next to `EditarEmMassa`'s existing "Adicionar nova" button on
  `caixa/editar-mes`, `caixa/copia`, `patrimonio/editar-mes`, and
  `patrimonio/copia` (all of which render `<EditarEmMassa tableName=... />`),
  passing `onCustomImport={addImportedTransacoes}` so rows are staged into
  the same in-memory list used by `addTransacao`/the drag-and-drop
  reordering, instead of being persisted immediately.

Uses the shared `Modal` component (`hideFooter`, custom footer buttons per
step, like `EditarEmMassa`'s modals):
1. **Passo 1 — Selecionar arquivo**: short instructions, a "Baixar modelo"
   link/button (lazy-generates and downloads the template file for the
   current table), and a file input accepting
   `.csv,.xls,.xlsx`. Loading state while the `xlsx` chunk is fetched and
   the file is parsed (`Loader` component, consistent with existing pages).
2. **Passo 2 — Pré-visualização**: table listing every parsed row with a
   status badge (`list-group-item-success`/`-danger`/`-warning`, consistent
   with `EditarEmMassa`'s receitas/despesas/warning styling) and a summary
   line ("N válidos, M com erro, K possíveis duplicados"). Invalid rows show
   their error reason; the user can proceed even with some invalid rows
   (those are simply excluded from import) but cannot proceed if 0 valid
   rows exist.
3. **Passo 3 — Confirmação**: explicit "Importar N registros" button
   (disabled while saving, shows the existing spinner pattern from
   `FormButtons` in `transacao-form.tsx`).
   - When `onCustomImport` is **not** provided (`/caixa`, `/patrimonio`
     direct use): calls `repository.saveAll(tableName, validRows)`, then
     `refresh()` (from `useStorage()`) and `NotificationUtil.send(...)` with
     a final success/error summary, then closes the modal.
   - When `onCustomImport` **is** provided (`EditarEmMassa` use, on
     editar-mês/copiar-mês pages): calls `onCustomImport(validRows)` instead
     (no `saveAll`/`refresh` here — the parent stages them into its own
     list, exactly like `addTransacao` does for the "Adicionar nova" modal),
     shows a lighter "N registros adicionados à lista, revise e clique em
     Salvar" notification, then closes the modal. Duplicate-detection in
     this mode also considers rows already staged in the page's in-memory
     list (not only what's already persisted), so importing the same file
     twice into one editing session still warns.
- Cancel/close at any step discards all in-memory parsed state (no partial
  writes — nothing is persisted before step 3's explicit confirmation, and
  in `onCustomImport` mode nothing is even staged until step 3).

## Testing strategy
- `utils/__tests__/planilha-import.test.ts` — pure unit tests (no
  sql.js/localforage mocking needed) covering: header normalization/mapping
  per table, date/value parsing edge cases (comma decimals, `R$` prefix,
  multiple date formats), invalid-row reasons, category fallback resolution,
  and duplicate-detection comparison logic — using plain in-memory fixtures
  for "existing records" and "parsed rows".
- `caixa/components/__tests__/importar-planilha.test.tsx` — React Testing
  Library tests mocking `useStorage()` (per existing test conventions, e.g.
  `transacao-form.test.tsx`) and mocking the dynamic `import('xlsx')` call
  (e.g. `jest.mock('xlsx', ...)`), covering: opening the modal, template
  download trigger, the 3-step flow rendering valid/invalid/duplicate rows,
  the confirm button calling `repository.saveAll` with only valid rows when
  `onCustomImport` is not passed, and calling `onCustomImport` instead (with
  no `saveAll` call) when it is passed, plus error/success notification
  calls for both modes.

## Rollout / risk mitigation
1. Land `utils/planilha-import.ts` + its unit tests first (pure logic, no
   UI/mocking risk).
2. Build `ImportarPlanilha` component (both persist-directly and
   `onCustomImport` staging modes) + wire it into `/caixa` and
   `/patrimonio` pages next.
3. Add component tests mocking storage + the lazy `xlsx` import, covering
   both modes.
4. Wire `onCustomImport` into `EditarEmMassa` (used by `editar-mes`/`copia`
   pages for both features) so imported rows merge into its existing
   receitas/despesas/semValor in-memory lists.
5. Manual verification: import a real sample `.xlsx`/`.csv`/`.xls` file on
   `/caixa`, `/patrimonio`, and all four `editar-mes`/`copia` pages; confirm
   staged rows on the latter are reorderable/editable/removable before
   "Salvar"/"Copiar" and are not persisted until then; confirm bundle for
   these pages doesn't include `xlsx` until the modal opens (Network tab);
   confirm duplicate warnings and category fallback behave as specified in
   both modes.
