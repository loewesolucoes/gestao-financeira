# Spec: Importar Caixa/Patrimônio via planilha (CSV/Excel)

## Status
`Draft` — not yet started. Captured from a design discussion on 2026-07-27.

## Tracking
GitHub issue: https://github.com/loewesolucoes/gestao-financeira/issues/26
Related specs: [006-emprestimos](../006-emprestimos/spec.md) (see "Future ideas" below — extending this import mechanism to `/emprestimos` depends on 006 landing first, since that page is currently just a placeholder).

## Problem statement
Today, adding entries to `/caixa` (`src/app/caixa/page.tsx`) or `/patrimonio`
(`src/app/patrimonio/page.tsx`) requires typing each transaction one by one
through `TransacaoForm`, or using `EditarEmMassa` to reorder/bulk-edit
entries already in the app. There is no way to bring in data that already
exists in a spreadsheet (e.g. exported from a bank, or a personal control
sheet kept in Excel/Google Sheets) — the user must retype every row by hand.

### Why this is a problem
- **Tedious onboarding/migration** — someone switching from a spreadsheet or
  another app to Gestão Financeira has to manually re-type months/years of
  history.
- **No bulk data entry from external sources** — bank statement exports
  (csv/xls/xlsx) can't be brought in directly.
- **Error-prone manual re-entry** — retyping increases the chance of typos
  in values/dates versus importing structured data directly.

## Goals
1. Add an **"Importar planilha"** button, available on `/caixa`,
   `/patrimonio`, and their respective "editar mês"
   (`caixa/editar-mes`, `patrimonio/editar-mes`) and "copiar mês"
   (`caixa/copia`, `patrimonio/copia`) pages — i.e. everywhere
   `EditarEmMassa` is rendered — that opens a guided import flow reading
   `.csv`, `.xls`, and `.xlsx` files.
   - On `/caixa` and `/patrimonio` (direct add via `TransacaoForm`), a
     confirmed import persists immediately, same as goal 6 below.
   - On the "editar mês"/"copiar mês" pages (`EditarEmMassa`), a confirmed
     import does **not** persist immediately — it only **stages** the valid
     rows into the page's existing in-memory list (the same list managed by
     `EditarEmMassa`'s "Adicionar nova" button), so imported rows can still
     be reordered, edited, or removed, and are only actually written to the
     database when the user clicks the page's own "Salvar transações do
     mês" / "Copiar transações para o mês" button — avoiding a double-save
     and staying consistent with how manually-added rows behave there.
2. Provide a **downloadable template file** (per table: caixa vs
   patrimônio) with the exact expected columns and one example row, in
   pt-br, so users know the expected format before filling their own file.
3. Parse the uploaded file client-side (no server), **preview** the parsed
   rows with per-row validation feedback (valid / invalid / warning) before
   anything is persisted, and let the user cancel before committing.
4. Automatically map recognized column headers (pt-br, case/accent
   insensitive) to the corresponding fields per table:
   - **Caixa** (`transacoes`): `data`, `valor`, `local`, `categoria`
     (optional — matched by `descricao` against existing categories, falling
     back silently to a default "Outros" category when unmatched or absent),
     `tipo` (optional — "Fixo"/"Variável", defaults to Variável),
     `comentario` (optional).
   - **Patrimônio** (`patrimonio`): `data`, `valor`, `local`, `comentario`
     (optional).
5. Detect and surface (non-blocking) **potential duplicates**: rows whose
   `data` + `valor` (and similar `local`) already match an existing record
   in the same table are flagged with a warning in the preview, but the user
   can still choose to import them.
6. On confirmation, persist all valid rows in a single batch via the
   existing `repository.saveAll(tableName, items)` and give clear
   success/error feedback (e.g. "X registros importados, Y ignorados por
   erro"), consistent with the app's existing toast/notification mechanism
   (`NotificationUtil.send`).
7. Load the spreadsheet-parsing library **lazily** (dynamic `import(...)`),
   only when the user actually opens the import modal — it must not be part
   of the initial page bundle for `/caixa` or `/patrimonio`.

## Non-goals
- **No server-side processing** — parsing and validation happen entirely in
  the browser; no file is ever uploaded anywhere.
- **No column-mapping persistence/profiles** — the mapping is recomputed
  each time from recognized headers; no saved "import profile" per user.
- **No support for `/emprestimos` in this iteration** — see "Future ideas".
- **No automatic bank-format detection** (e.g. OFX or specific bank export
  quirks) — only generic csv/xls/xlsx with the app's expected column names.
- **No undo/rollback UI for a completed import** — once confirmed, imported
  rows become regular records, editable/removable one by one exactly like
  manually-entered ones (via existing edit/delete flows); no dedicated
  "undo last import" action.
- **No de-duplication auto-merge** — duplicate warnings are informational
  only; the app never silently skips or merges a row on the user's behalf.
- **Not implementing the actual code change in this spec** — this spec (with
  its companion `plan.md`/`tasks.md`) only documents the planned change; the
  actual implementation in `src/app/**` is a follow-up piece of work.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side,
  offline-first PWA — no server-side code; all persistence goes through the
  existing sql.js-in-a-Web-Worker + localforage stack
  (`repositories/default.ts` / `database-connector.ts`).
- No schema/migration changes are needed — this feature only creates rows in
  the existing `transacoes`/`patrimonio` tables through the existing
  `DefaultRepository.saveAll` batch-insert path.
- Monetary values must use **`bignumber.js`**, dates must use **`moment`**,
  consistent with every existing repository/form (`transacao-form.tsx`).
- UI copy must be in **Brazilian Portuguese (pt-br)**.
- UI must follow existing conventions (Bootstrap 5 + SCSS, the shared
  `Modal` component, the shared `Input` component, `page.tsx`/
  `page-component.tsx`/`components/` layout, the `tableName?: TableNames`
  prop pattern already used by `TransacaoForm`/`EditarEmMassa` to share one
  component between `/caixa` and `/patrimonio`).
- Any third-party spreadsheet-parsing library must be **loaded via dynamic
  `import()`** at the point of use (opening the import modal), not statically
  imported at module scope, to avoid bloating the main `/caixa`/`/patrimonio`
  bundles in this statically-exported app.
- Must give clear, responsive user feedback at every step (file selected,
  parsing, validation summary, importing, success/error) — no silent
  failures; use `NotificationUtil.send(...)` for toast-style feedback and
  inline UI state for progress within the modal.

## Acceptance criteria
- [ ] An "Importar planilha" button is visible on `/caixa`, `/patrimonio`,
      and their "editar mês"/"copiar mês" pages (everywhere `EditarEmMassa`
      is rendered), and opens a modal-based import flow.
- [ ] The user can download a template file (per table) showing the exact
      expected columns and one example row before preparing their own file.
- [ ] The user can select a `.csv`, `.xls`, or `.xlsx` file, and the app
      parses it client-side without any network request.
- [ ] Parsed rows are shown in a preview with per-row status (valid /
      invalid with reason / warning for possible duplicate) before any data
      is persisted.
- [ ] Recognized pt-br column headers are automatically mapped to the
      correct fields per table (`data`, `valor`, `local`, `comentario`, and
      `categoria`/`tipo` for caixa).
- [ ] Unmatched/unknown category names fall back to the default "Outros"
      category without blocking the import.
- [ ] Rows that look like duplicates of existing records (same date + valor
      + similar local, same table) are flagged with a non-blocking warning.
- [ ] Confirming the import persists all valid rows in one batch via
      `repository.saveAll` and shows a clear success/error summary
      (counts of imported vs. ignored rows) — **except** on the "editar
      mês"/"copiar mês" pages, where confirming instead stages the valid
      rows into the page's existing in-memory list (no immediate
      persistence) until the user clicks that page's own "Salvar"/"Copiar"
      button.
- [ ] The spreadsheet-parsing library is not present in the initial JS
      bundle for `/caixa`/`/patrimonio` — verified it's only fetched when the
      import modal is opened (e.g. via Network tab / bundle analysis).
- [ ] `npm run lint` and `npm test` (including new tests) pass once
      implemented.

## Future ideas (documented only — not implemented by this spec)
- **Import on `/emprestimos`** — once
  [spec 006-emprestimos](../006-emprestimos/spec.md) is actually implemented
  (currently a placeholder page), extend the same import mechanism/component
  to let users bulk-import loans (`emprestimos`) and/or installments
  (`emprestimo_parcelas`) from a spreadsheet, following the same
  template-download + preview + validation UX established here.
- **Saved column-mapping profiles** — remember a user's custom column
  mapping (e.g. for a recurring bank export format) instead of
  auto-detecting headers every time.
- **OFX / bank-specific import formats** — dedicated parsers for common
  bank statement export formats beyond generic csv/xls/xlsx.
