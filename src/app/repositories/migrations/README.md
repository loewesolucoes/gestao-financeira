# Repository migrations

All database schema changes are tracked here, split per repository, instead
of one giant function. This directory implements spec
[001-repository-migrations-refactor](../../../../specs/001-repository-migrations-refactor/spec.md).

## Adding a new migration

1. Add a new `.sql` file under `sql/<your-repo>/NNN_description.sql`
   (`NNN` = next local number for that repo folder, e.g. `004_...`). Keep the
   file to the exact SQL you want executed — no comments needed, but multiple
   statements (e.g. `PRAGMA` + `ALTER` + `PRAGMA`) are fine in one file.
2. Import it in your repository's migration list file (e.g. `metas.ts`) and
   append a new entry with a **new, unique, stable `name`** — this is the id
   stored in the `migrations` tracking table, so never reuse or rename an
   existing one:
   ```ts
   import metasAddAlgoSql from "./sql/metas/002_add_algo.sql";

   export const METAS_MIGRATIONS: Migration[] = [
     { name: "metas", run: (db) => importAndExec(db, metasCreateSql) },
     { name: "metas_campo_algo", run: (db) => importAndExec(db, metasAddAlgoSql) },
   ];
   ```
3. If your migration must run after another repository's migration (e.g. it
   adds a FK to a table another repo owns), add/adjust the ordering in
   `registry.ts` and document *why* in a comment there — `registry.ts` is the
   single place cross-repository ordering is decided.
4. Run `npm test` — the baseline regression tests in
   `../__tests__/migrations.test.ts` and
   `../__tests__/migrations-fixture-regression.test.ts` will catch schema or
   ordering mistakes.

## Why per-repo `.sql` files instead of one big function?

See `specs/001-repository-migrations-refactor/spec.md` for the full
rationale (colocation, no merge-conflict hotspot, reviewable raw SQL). In
short: each repository owns its own schema history, `registry.ts` is the only
place that needs to reason about cross-repository ordering, and `.sql` files
get proper SQL syntax highlighting instead of being escaped TS strings.

## How `.sql` files are loaded

- **Webpack (`npm run build` / `npm run dev`)**: `next.config.js` has a rule
  (`{ test: /\.sql$/, type: "asset/source" }`) that inlines the raw file
  content as a string import at build time — no network fetch needed, works
  fine with `output: 'export'`.
- **Jest**: `jest.config.ts` wires `.sql` files through
  `jest.sql-transformer.js`, a tiny transform that does the same thing
  (`module.exports = "<file content>"`), so migration code runs identically
  under tests.
- TypeScript sees `.sql` imports as `string` via the ambient declaration in
  `src/types/sql.d.ts`.

`importAndExec(db, sqlContent)` (in `load-sql.ts`) is just a thin
`db.exec(sqlContent)` wrapper — each per-repo migration list statically
`import`s its own `.sql` file(s) and passes the content through.
