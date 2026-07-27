# Tasks: Repository-Scoped SQL Migrations

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task should be a small, reviewable commit.

- [ ] **T1 — Snapshot current behavior (safety net)**
  - Record the exact ordered list of migration names currently produced by `runMigrations()` in `src/app/repositories/default.ts`.
  - Export a real SQLite DB from a running instance of the app (via the existing export/import feature) to use as a regression fixture (confirms no re-run/skip after refactor).

- [ ] **T2 — Add build/tooling support for `.sql` imports**
  - Add a webpack rule in `next.config.js` (`{ test: /\.sql$/, type: 'asset/source' }`).
  - Add ambient module declaration for `*.sql` (e.g. `src/types/sql.d.ts`).
  - Verify `npm run build` bundles a trivial test `.sql` import correctly (static export still works).

- [ ] **T3 — Introduce `migrations/types.ts`**
  - Define the `Migration` interface (`name`, `run`).

- [ ] **T4 — Extract migrations per repository into `.sql` files + per-repo migration lists**
  - `parametros/001_create.sql` + `PARAMETROS_MIGRATIONS`
  - `categoria-transacoes/001_create.sql` (incl. default "Outros" insert) + `CATEGORIA_TRANSACOES_MIGRATIONS`
  - `transacoes/001_create.sql`, `002_add_ordem_column.sql`, `003_add_categoria_fk.sql` + `TRANSACOES_MIGRATIONS`
  - `patrimonio/001_create_saldos.sql`, `002_rename_saldos_to_patrimonio.sql` + `PATRIMONIO_MIGRATIONS`
  - `notas/001_create.sql`, `002_add_tipo_e_comentario.sql` + `NOTAS_MIGRATIONS`
  - `metas/001_create.sql` + `METAS_MIGRATIONS`
  - **Preserve exact existing migration `name` strings** in every case (critical — do not rename).

- [ ] **T5 — Build `migrations/registry.ts`**
  - Import all per-repo migration lists in the correct cross-repo order.
  - Add inline comments documenting *why* order matters where there's a dependency (e.g. `categoria_transacoes` before `transacoes` FK migration).

- [ ] **T6 — Update `default.ts`'s `runMigrations()`**
  - Replace the inline `if (migrations['x'] == null) {...}` blocks with a loop over `ALL_MIGRATIONS` from the registry.
  - Keep the `migrations` table bootstrap/read/persist logic unchanged.

- [ ] **T7 — Automated tests**
  - Unit test: fresh in-memory DB + run `ALL_MIGRATIONS` → assert final schema (tables/columns) matches current expectations.
  - Regression test: assert the flattened `ALL_MIGRATIONS` name list exactly matches the T1 snapshot (same names, same order).

- [ ] **T8 — Manual regression pass**
  - Load the T1 exported DB fixture in the refactored app; confirm zero migrations re-run (check `migrations` table row count/content before vs after).
  - Smoke-test each feature (caixa, metas, patrimonio, notas, configuracoes) to confirm no behavior change.

- [ ] **T9 — Documentation**
  - Add a short "Adding a migration" note (e.g. in `.github/copilot-instructions.md` or a README in `migrations/`) describing the new per-repo `.sql` + registry pattern, so future contributors follow it instead of reverting to inline strings.

## Out of scope (future follow-ups, not part of this work)
- Down/rollback migrations.
- Adopting a third-party migration library.
- Any actual schema/column changes beyond what already exists today.
