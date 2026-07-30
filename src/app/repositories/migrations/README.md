# Repository migrations

All database schema changes are tracked here — SQL lives in its own file per
migration, but the migration list/registry itself lives in a single
`index.ts` (kept as one file on purpose, instead of one file per repository,
so there's one place to read the full ordered history). This directory
implements spec
[001-repository-migrations-refactor](../../../../specs/001-repository-migrations-refactor/spec.md).

## Adding a new migration

1. Add a new `.sql` file under `sql/<your-repo>/NNN_description.sql`
   (`NNN` = next local number for that repo folder, e.g. `004_...`). Keep the
   file to the exact SQL you want executed — no comments needed, but multiple
   statements (e.g. `PRAGMA` + `ALTER` + `PRAGMA`) are fine in one file.
2. In `index.ts`, import the new file and append a new entry to
   `ALL_MIGRATIONS`, in the right position, with a **new, unique, stable
   `name`** — this is the id stored in the `migrations` tracking table, so
   never reuse or rename an existing one:
   ```ts
   import metasAddAlgoSql from "./sql/metas/002_add_algo.sql";

   export const ALL_MIGRATIONS: Migration[] = [
     // ...
     { name: "metas", run: (db) => importAndExec(db, metasCreateSql) },
     { name: "metas_campo_algo", run: (db) => importAndExec(db, metasAddAlgoSql) },
     // ...
   ];
   ```
3. If your migration must run after another table's migration (e.g. it adds a
   FK to a table another migration owns), place it accordingly in
   `ALL_MIGRATIONS` and document *why* with a comment — `index.ts` is the
   single place cross-table ordering is decided.
4. Run `npm test` — the baseline regression tests in
   `../__tests__/migrations.test.ts` and
   `../__tests__/migrations-fixture-regression.test.ts` will catch schema or
   ordering mistakes.

## Why one `.sql` file per migration, but one `index.ts` for the list?

See `specs/001-repository-migrations-refactor/spec.md` for the full
rationale. In short: `.sql` files get proper SQL syntax highlighting instead
of being escaped TS strings, and are easy to diff/review in isolation. The
migration *list*, however, is kept in a single `index.ts` rather than split
per repository, since all tables live in one SQLite database and the full,
exact historical run order only needs to be reasoned about in one place.

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

`importAndExec(db, sqlContent)` (in `index.ts`) is just a thin
`db.exec(sqlContent)` wrapper — each migration entry statically `import`s its
own `.sql` file(s) and passes the content through.
