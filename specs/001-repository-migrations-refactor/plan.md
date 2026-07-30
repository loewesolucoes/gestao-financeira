# Plan: Repository-Scoped SQL Migrations

Companion technical design for `spec.md`. Describes the target file layout, types, build config, and migration path.

## Target file layout

```
src/app/repositories/
  migrations/
    types.ts                         # Migration type
    load-sql.ts                      # importAndExec(db, fileName) helper (require.context)
    registry.ts                      # Single ordered manifest (cross-repo order lives here)
    sql/
      parametros/
        001_create.sql
      categoria-transacoes/
        001_create.sql                 # includes the default "Outros" INSERT
      transacoes/
        001_create.sql
        002_add_ordem_column.sql
        003_add_categoria_fk.sql       # PRAGMA off / ALTER / PRAGMA on
      patrimonio/
        001_create_saldos.sql
        002_rename_saldos_to_patrimonio.sql
      notas/
        001_create.sql
        002_add_tipo_e_comentario.sql
      metas/
        001_create.sql
    parametros.ts                    # PARAMETROS_MIGRATIONS list (uses importAndExec)
    categoria-transacoes.ts          # CATEGORIA_TRANSACOES_MIGRATIONS list
    transacoes.ts                    # TRANSACOES_MIGRATIONS list
    patrimonio.ts                    # PATRIMONIO_MIGRATIONS list
    notas.ts                         # NOTAS_MIGRATIONS list
    metas.ts                         # METAS_MIGRATIONS list
  default.ts                          # runMigrations() now just iterates registry.ts
```

All `.sql` files live under one `migrations/sql/` tree (required for a single `require.context` root), while each repository's *migration list* (pairing a stable `name` with an `importAndExec(db, 'fileName.sql')` call) stays colocated with that repository's other migration metadata.

Naming convention: `NNN_description.sql`, numbered per-repository folder. The number gives *local* order within a repo; `registry.ts` gives the *global* order across repos.

## Types

```ts
// migrations/types.ts
export interface Migration {
  name: string;                         // stable id stored in the `migrations` table — must match today's existing names for already-shipped migrations
  run: (db: SqlDb) => Promise<void> | void;
}
```

Static `.sql`-file migrations become:
```ts
{ name: 'transacoes_campo_ordem', run: db => importAndExec(db, 'transacoes/002_add_ordem_column.sql') }
```
Keeping the exact existing `name` strings (e.g. `'transacoes_campo_ordem'`, `'rename_saldos_to_patrimonio'`) is required so existing users' persisted DBs don't re-run migrations already marked complete.

## Build/tooling changes required

1. **`migrations/load-sql.ts`** — a small helper wrapping `db.exec(sqlContent)`. Each per-repo migration list does a plain static `import` of its `.sql` file(s) and passes the imported string to `importAndExec`:
   ```ts
   // migrations/load-sql.ts
   export function importAndExec(db: IDatabase, sqlContent: string) {
     return db.exec(sqlContent);
   }
   ```
   Usage in a repo's migration list:
   ```ts
   import parametrosCreateSql from './sql/parametros/001_create.sql';
   { name: 'parametros', run: db => importAndExec(db, parametrosCreateSql) }
   ```
   **Implementation deviation from the original design (documented during T4/T5):** the original design used webpack's `require.context` so migration entries could reference a `.sql` file **by filename string** rather than a manual `import` per file. That was dropped in favor of plain static imports because `require.context` is webpack-only and has no equivalent under Jest's SWC-based transform — since the T2/T7 regression tests must actually execute `ALL_MIGRATIONS` under Jest, the loader has to work identically in both the webpack build and the test runner. Static imports satisfy both: `next.config.js`'s `asset/source` rule inlines the raw string at webpack build time, and a small Jest transform (`jest.sql-transformer.js`, wired via `jest.config.ts`'s `transform` map) does the same for `.sql` files under Jest. This also removes the need for the "verify every filename string resolves" runtime check below, since TypeScript now type-checks each import path at compile time.
2. Verify the static export build still bundles these correctly (`npm run build`) — confirmed: the webpack compile stage succeeds with real `.sql` imports in place (an unrelated, pre-existing "You must set env variables" prerender failure reproduces identically with or without this change, in environments missing certain secrets — not something this refactor introduced or needs to fix).
3. ~~Add a small startup/unit check that every filename referenced across `ALL_MIGRATIONS` actually resolves~~ — superseded by static imports (point 1): an unresolvable `.sql` path is now a compile-time error, not a runtime lookup failure.

## Registry (cross-repo ordering)

```ts
// migrations/registry.ts
import { PARAMETROS_MIGRATIONS } from './parametros';
import { CATEGORIA_TRANSACOES_MIGRATIONS } from './categoria-transacoes';
import { TRANSACOES_MIGRATIONS, TRANSACOES_CATEGORIA_FK_MIGRATIONS } from './transacoes';
import { PATRIMONIO_MIGRATIONS } from './patrimonio';
import { NOTAS_MIGRATIONS } from './notas';
import { METAS_MIGRATIONS } from './metas';

// This exact order reproduces the historical order migrations ran in
// default.ts#runMigrations() prior to the refactor (parametros, transacoes
// x2, patrimonio x2, notas x2, metas, categoria_transacoes, then the FK
// migration) — required so the `migrations` tracking table's row order
// matches the T1/T2/T7 regression snapshot exactly.
export const ALL_MIGRATIONS: Migration[] = [
  ...PARAMETROS_MIGRATIONS,
  ...TRANSACOES_MIGRATIONS,
  ...PATRIMONIO_MIGRATIONS,
  ...NOTAS_MIGRATIONS,
  ...METAS_MIGRATIONS,
  ...CATEGORIA_TRANSACOES_MIGRATIONS,
  ...TRANSACOES_CATEGORIA_FK_MIGRATIONS,
];
```

**Implementation deviation from the original design:** the original sketch grouped `CATEGORIA_TRANSACOES_MIGRATIONS` right after `PARAMETROS_MIGRATIONS` (a natural-looking dependency order), but that does **not** match the actual historical execution order in `default.ts` — historically, `categoria_transacoes` and its FK migration ran *last*, after `transacoes`/`patrimonio`/`notas`/`metas` were already created. Since the T1 snapshot and T2/T7 tests assert the exact ordered migration-name list, the FK migration (`categoria_transacoes_chave_estrangeira`) was pulled out of `TRANSACOES_MIGRATIONS` into its own exported `TRANSACOES_CATEGORIA_FK_MIGRATIONS` list (still colocated in `transacoes.ts`/`sql/transacoes/003_add_categoria_fk.sql`), so the registry can place it — and `CATEGORIA_TRANSACOES_MIGRATIONS` — at the end, exactly reproducing history.

Add a short code comment (as above) documenting *why* a given order is required whenever there's a cross-repo dependency — this is the one place ordering subtleties must stay visible.

## `default.ts` changes

`runMigrations()` shrinks to:
```ts
protected async runMigrations() {
  await this.db.exec(`CREATE TABLE IF NOT EXISTS "migrations" (...)`); // unchanged
  const migrations = /* load executed migrations, unchanged */;

  for (const migration of ALL_MIGRATIONS) {
    if (migrations[migration.name] == null) {
      await migration.run(this.db);
      migrations[migration.name] = RUNNED_MIGRATION_CODE;
    }
  }

  // persist newly-run migration rows — same logic as today
}
```

## Mixed static/dynamic migrations
Not every future migration will be pure static SQL. Keep `Migration.run` as a function (not just a raw SQL string) so a rare migration needing JS logic (e.g. conditional statements, data transformation) can still be defined inline in a repo's migration list without a `.sql` file — the `.sql` file approach is the *default*, not the *only* option.

## Testing strategy
- **Baseline test written first (before any refactor code changes)**: build a fresh in-memory sql.js DB, run **today's unmodified** `runMigrations()`, and assert the final schema (table/column existence, types, the `transacoes.categoriaId` FK) plus the exact ordered `migrations` name list from the T1 snapshot. This must pass against the pre-refactor code before T3 (build tooling) starts — it's the safety net the rest of the work is built against, not an after-the-fact check.
- **Re-run unchanged as the equivalence gate**: after the refactor (T3–T6), re-run the identical baseline suite against `ALL_MIGRATIONS`/the new `runMigrations()` with zero test edits. It must still pass, proving statement-for-statement equivalence.
- Manual test: run the app against an existing exported/persisted DB (pre-refactor) and confirm no migrations re-run (i.e., `migrations` table state after refactor matches what it would've been before).

## Rollout / risk mitigation
1. Do the refactor in one PR with **no schema changes** — a pure reorganization.
2. Snapshot today's full ordered list of migration names + their exact SQL before starting, to diff against after.
3. Test against a real exported DB file from the current app (not just a fresh DB) to ensure no double-migration or skipped-migration issues for existing users.
