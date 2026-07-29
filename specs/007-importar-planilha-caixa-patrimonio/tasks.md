# Tasks: Importar Caixa/Patrimônio via planilha (CSV/Excel)

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each
task should be a small, reviewable commit.

- [ ] **T1 — Add the `xlsx` dependency**
  - `npm install xlsx` (runtime dependency). Confirm it's never statically
    imported at module scope anywhere.

- [ ] **T2 — Parsing/mapping/validation utilities**
  - Create `src/app/utils/planilha-import.ts`: header normalization, per-
    table column dictionaries (caixa vs patrimônio), date/value parsing
    (comma/dot decimals, `R$` prefix, multiple date formats via `moment`),
    category name → `categoriaId` resolution (fallback to default/"Outros"),
    duplicate-detection comparison against existing records, and a
    `parseWorkbookRows(tableName, rows, existing, categorias)` entry point
    returning the row-status array described in `plan.md`.

- [ ] **T3 — Utility unit tests**
  - `src/app/utils/__tests__/planilha-import.test.ts` covering header
    mapping, parsing edge cases, invalid-row reasons, category fallback, and
    duplicate detection, per the "Testing strategy" section of `plan.md`.

- [ ] **T4 — Template file generator**
  - Add a `gerarModeloPlanilha(tableName)` helper (in the same utils module
    or a sibling) that lazily imports `xlsx` and triggers a download of a
    `.xlsx` template with the correct columns + one pt-br example row per
    table.

- [ ] **T5 — `ImportarPlanilha` component (UI shell)**
  - Create `src/app/caixa/components/importar-planilha.tsx`: button +
    `Modal`-based 3-step wizard (selecionar arquivo/baixar modelo →
    pré-visualização → confirmação) per `plan.md`'s "UI design", with
    `tableName?: TableNames` and `onCustomImport?: (rows) => void` props
    mirroring `TransacaoForm`'s `onCustomSubmit` pattern.
  - Wire the file `<input>` to lazily `import('xlsx')`, read the file
    (`XLSX.read` + `utils.sheet_to_json`), and feed rows into
    `parseWorkbookRows`.

- [ ] **T6 — Preview step UX**
  - Render parsed rows with status badges (válido/inválido/aviso-duplicado),
    a summary count line, and disable "continue" when there are zero valid
    rows.

- [ ] **T7 — Confirm/import step (both modes)**
  - When `onCustomImport` is not provided: wire the confirm button to
    `repository.saveAll(tableName, validRows)`, `refresh()`, and
    `NotificationUtil.send(...)` success/error summaries; loading/disabled
    state consistent with `FormButtons` in `transacao-form.tsx`.
  - When `onCustomImport` is provided: call it with `validRows` instead
    (no `saveAll`/`refresh`), and show the lighter "adicionado(s) à lista"
    notification described in `plan.md`.

- [ ] **T8 — Component tests**
  - `src/app/caixa/components/__tests__/importar-planilha.test.tsx` per
    `plan.md`'s "Testing strategy" (mock `useStorage()`, mock the dynamic
    `xlsx` import, cover the full 3-step flow and error/success paths for
    both the direct-persist mode and the `onCustomImport` staging mode).

- [ ] **T9 — Integrate into `/caixa` and `/patrimonio` pages**
  - Add the `<ImportarPlanilha />` button to `caixa/page.tsx`'s forms column
    (next to `TransacaoForm`) and to `patrimonio/page.tsx` the same way,
    passing `tableName={TableNames.PATRIMONIO}` on the patrimônio page.

- [ ] **T10 — Integrate into `EditarEmMassa` (editar-mês/copiar-mês pages)**
  - Add an `<ImportarPlanilha tableName={tableName} onCustomImport={...} />`
    button next to `EditarEmMassa`'s existing "Adicionar nova" button
    (`caixa/components/editar-em-massa.tsx`), wiring `onCustomImport` to
    stage the returned rows into the same in-memory list used by
    `addTransacao` (so they show up in `receitas`/`despesas`/`semValor`,
    are draggable/editable/removable, and are only persisted when the page's
    own "Salvar"/"Copiar" button is clicked). This automatically covers
    `caixa/editar-mes`, `caixa/copia`, `patrimonio/editar-mes`, and
    `patrimonio/copia` since they all render `EditarEmMassa`.
  - Ensure duplicate-detection in this mode also compares against rows
    already staged in `EditarEmMassa`'s current in-memory list, not just
    what's already persisted.

- [ ] **T11 — Manual verification**
  - Import a real sample `.xlsx`, `.xls`, and `.csv` file on `/caixa`,
    `/patrimonio`, and all four `editar-mes`/`copia` pages; verify template
    download produces a file that re-imports cleanly; verify duplicate
    warnings and category fallback in both direct-persist and staging
    modes; verify staged rows on `editar-mes`/`copia` are not persisted
    until "Salvar"/"Copiar" is clicked; verify (via browser Network tab /
    build output) that `xlsx` is not part of the initial JS bundle for any
    of these pages and is only fetched when the import modal opens.

- [ ] **T12 — Lint/build/test gate**
  - Run `npm run lint`, `npm run build` (confirm static export + chunk
    splitting still succeed), and `npm test` (full suite) and confirm
    everything passes before merging.

## Out of scope (future follow-ups, not part of this work)
- Import support on `/emprestimos` (blocked on spec 006 being implemented).
- Saved/persisted column-mapping profiles.
- OFX or other bank-specific import formats.
