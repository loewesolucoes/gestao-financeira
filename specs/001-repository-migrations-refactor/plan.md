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

1. **`migrations/load-sql.ts`** — a small helper built on webpack's `require.context`, so migration entries can reference a `.sql` file **by filename string** instead of a manual `import` per file:
   ```ts
   // migrations/load-sql.ts
   const sqlFiles = require.context('./sql', true, /\.sql$/); // scans at build time

   export function importAndExec(db: SqlDb, fileName: string) {
     const content = sqlFiles(`./${fileName}`);
     return db.exec(content);
   }
   ```
   Usage in a repo's migration list:
   ```ts
   { name: 'transacoes__001_create', run: db => importAndExec(db, 'transacoes/001_create.sql') }
   ```
   Note: `require.context` is a **webpack-specific** API. It works today because `next.config.js` already runs a custom webpack function (no Turbopack in use). If the project ever migrates to Turbopack, this helper is the one place that would need an equivalent swap (e.g. `import.meta.glob`-style pattern) — everything else in this plan is unaffected.
2. Verify the static export build still bundles these correctly (`npm run build`) — `require.context` resolves and inlines matched files at build time, so no extra `public/` copy step is needed (unlike the sql.js WASM assets, which use `copy-webpack-plugin` for a different reason: they must remain fetchable as separate worker/wasm assets, not inlined).
3. Add a small startup/unit check that every filename referenced across `ALL_MIGRATIONS` actually resolves via `sqlFiles(...)` — since the lookup is string-keyed, a typo would only fail at runtime otherwise.

## Registry (cross-repo ordering)

```ts
// migrations/registry.ts
import { PARAMETROS_MIGRATIONS } from './parametros';
import { CATEGORIA_TRANSACOES_MIGRATIONS } from './categoria-transacoes';
import { TRANSACOES_MIGRATIONS } from './transacoes';
import { PATRIMONIO_MIGRATIONS } from './patrimonio';
import { NOTAS_MIGRATIONS } from './notas';
import { METAS_MIGRATIONS } from './metas';

// Order matters: categoria_transacoes must run before transacoes' FK migration.
export const ALL_MIGRATIONS: Migration[] = [
  ...PARAMETROS_MIGRATIONS,
  ...CATEGORIA_TRANSACOES_MIGRATIONS,
  ...TRANSACOES_MIGRATIONS,
  ...PATRIMONIO_MIGRATIONS,
  ...NOTAS_MIGRATIONS,
  ...METAS_MIGRATIONS,
];
```

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
- Unit test: build a fresh in-memory sql.js DB, run `ALL_MIGRATIONS` end-to-end, assert final schema (table/column existence) matches current expectations.
- Regression test: verify migration `name`s in the new registry exactly match the full set of names currently produced by `runMigrations()` today (snapshot the list before refactoring, diff after).
- Manual test: run the app against an existing exported/persisted DB (pre-refactor) and confirm no migrations re-run (i.e., `migrations` table state after refactor matches what it would've been before).

## Rollout / risk mitigation
1. Do the refactor in one PR with **no schema changes** — a pure reorganization.
2. Snapshot today's full ordered list of migration names + their exact SQL before starting, to diff against after.
3. Test against a real exported DB file from the current app (not just a fresh DB) to ensure no double-migration or skipped-migration issues for existing users.
