# Tasks: Repository-Scoped SQL Migrations

Checklist for implementing `spec.md` / `plan.md`. Work top to bottom; each task should be a small, reviewable commit.

- [x] **T1 — Snapshot current behavior (safety net)**
  - Record the exact ordered list of migration names currently produced by `runMigrations()` in `src/app/repositories/default.ts`.
  - Export a real SQLite DB from a running instance of the app (via the existing export/import feature) to use as a regression fixture (confirms no re-run/skip after refactor).

- [x] **T2 — Write baseline migration tests against the CURRENT implementation**
  - Before touching any code, add a Jest test (e.g. `src/app/repositories/__tests__/migrations.test.ts`) that runs today's `runMigrations()` (via `DefaultRepository`) against a fresh in-memory sql.js DB and asserts the resulting schema: exact set of tables, exact set of columns per table (name/type/nullability), and the FK on `transacoes.categoriaId`.
  - Add a second assertion in the same test (or a companion test) that the `migrations` table ends up with exactly the T1-snapshotted list of names, in order.
  - Run this test now and confirm it **passes against the pre-refactor code** — this is the regression harness the refactor must keep green throughout T3–T7, not just a final check.

- [x] **T3 — Add build/tooling support for `.sql` imports**
  - Add a webpack rule in `next.config.js` (`{ test: /\.sql$/, type: 'asset/source' }`).
  - Add ambient module declaration for `*.sql` (e.g. `src/types/sql.d.ts`).
  - Verify `npm run build` bundles a trivial test `.sql` import correctly (static export still works).

- [x] **T3b — Introduce `migrations/types.ts`**
  - Define the `Migration` interface (`name`, `run`).

- [x] **T4 — Extract migrations per repository into `.sql` files + per-repo migration lists**
  - `parametros/001_create.sql` + `PARAMETROS_MIGRATIONS`
  - `categoria-transacoes/001_create.sql` (incl. default "Outros" insert) + `CATEGORIA_TRANSACOES_MIGRATIONS`
  - `transacoes/001_create.sql`, `002_add_ordem_column.sql`, `003_add_categoria_fk.sql` + `TRANSACOES_MIGRATIONS`
  - `patrimonio/001_create_saldos.sql`, `002_rename_saldos_to_patrimonio.sql` + `PATRIMONIO_MIGRATIONS`
  - `notas/001_create.sql`, `002_add_tipo_e_comentario.sql` + `NOTAS_MIGRATIONS`
  - `metas/001_create.sql` + `METAS_MIGRATIONS`
  - **Preserve exact existing migration `name` strings** in every case (critical — do not rename).

- [x] **T5 — Build `migrations/registry.ts`**
  - Import all per-repo migration lists in the correct cross-repo order.
  - Add inline comments documenting *why* order matters where there's a dependency (e.g. `categoria_transacoes` before `transacoes` FK migration).

- [x] **T6 — Update `default.ts`'s `runMigrations()`**
  - Replace the inline `if (migrations['x'] == null) {...}` blocks with a loop over `ALL_MIGRATIONS` from the registry.
  - Keep the `migrations` table bootstrap/read/persist logic unchanged.

- [x] **T7 — Re-run baseline tests against the refactored code**
  - Re-run the T2 baseline test suite unchanged against the refactored `runMigrations()`/`ALL_MIGRATIONS` — it must pass with zero modifications, proving schema and migration-name-list equivalence.
  - Add any additional targeted assertions the refactor surfaced as useful (e.g. `ALL_MIGRATIONS` name list exactly matches the T1 snapshot, same order), but the T2 suite is the primary equivalence gate.

- [x] **T8 — Manual regression pass**
  - Load the T1 exported DB fixture in the refactored app; confirm zero migrations re-run (check `migrations` table row count/content before vs after).
  - Smoke-test each feature (caixa, metas, patrimonio, notas, configuracoes) to confirm no behavior change.

- [x] **T9 — Documentation**
  - Add a short "Adding a migration" note (e.g. in `.github/copilot-instructions.md` or a README in `migrations/`) describing the new per-repo `.sql` + registry pattern, so future contributors follow it instead of reverting to inline strings.

## Out of scope (future follow-ups, not part of this work)
- Down/rollback migrations.
- Adopting a third-party migration library.
- Any actual schema/column changes beyond what already exists today.
