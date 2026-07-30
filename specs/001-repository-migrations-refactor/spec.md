# Spec: Repository-Scoped SQL Migrations

## Status
`Implemented` — completed 2026-07-29. Captured from a design discussion on 2026-07-26.

## Tracking
GitHub issue: [#35](https://github.com/loewesolucoes/gestao-financeira/issues/35)
Related specs: [002-github-actions-ci-cd](../002-github-actions-ci-cd/spec.md) ([#36](https://github.com/loewesolucoes/gestao-financeira/issues/36))

## Problem statement
All database schema migrations currently live in a single, ever-growing method — `runMigrations()` in `src/app/repositories/default.ts`. Each migration is an inline template-literal SQL string guarded by a check against a `migrations` table:

```ts
if (migrations['transacoes_campo_ordem'] == null) {
  await this.db.exec(`ALTER TABLE "transacoes" ADD COLUMN "ordem" INTEGER NULL;`);
  migrations['transacoes_campo_ordem'] = RUNNED_MIGRATION_CODE;
}
```

This has grown to ~10 blocks covering `parametros`, `transacoes`, `saldos`/`patrimonio`, `notas`, `metas`, `categoria_transacoes`, and their subsequent `ALTER TABLE` changes.

### Why this is a problem
- **No explicit ordering/versioning** — order is "wherever the block sits in the function." Nothing prevents accidental reordering or name collisions between unrelated changes.
- **Poor colocation** — schema history for `transacoes` lives far from `src/app/repositories/transacoes.ts`, making it hard to find "what does this table look like" while working on a feature.
- **Merge-conflict magnet** — every new migration edits the same function/file regardless of which repository it belongs to.
- **Hard to review** — raw SQL as escaped TS template strings has no SQL syntax highlighting/linting, and multi-statement migrations (e.g. `PRAGMA` + `ALTER` + `PRAGMA`) are awkward to read inline.

## Goals
1. Split migrations so each repository owns and colocates its own schema history.
2. Store migration SQL in real `.sql` files (not TS template strings) for readability/tooling, while keeping room for the rare migration that needs JS logic.
3. Preserve a single, explicit, reviewable global ordering — since all tables share **one SQLite database**, cross-repository ordering dependencies (e.g. a FK migration on `transacoes` that requires `categoria_transacoes` to exist first) must remain visible and correct.
4. No behavior change: the resulting SQL executed against the DB, the `migrations` tracking table contents, and app behavior must be identical to today — this is a pure internal refactor.

## Non-goals
- Not introducing a third-party migration framework/library.
- Not changing the DB engine (still sql.js/SQLite-in-worker) or persistence mechanism (still localforage export/import via `persistDb()`).
- Not adding down/rollback migrations (out of scope for this iteration — could be a future spec).
- Not changing any actual schema/columns — this is a structural refactor of *how* migrations are organized and run, not *what* they do.

## Constraints (project-specific)
- App is a **static export** (`output: 'export'`), fully client-side, offline-first PWA — no server-side file access at runtime. `.sql` files must be **bundled at build time** (webpack), not fetched over the network.
- `next.config.js` already has custom webpack rules (`@svgr/webpack` for SVGs, `copy-webpack-plugin` for sql.js WASM assets) — a new rule for `.sql` raw imports needs to be added there.
- TypeScript needs an ambient module declaration for `*.sql` imports since there's no built-in type for them.
- Existing migrations table schema (`id`, `name`, `executedDate`) must not change — old migration names already recorded in users' persisted DBs need to keep matching, or the same migrations would re-run.

## Acceptance criteria
- [x] Each repository (`transacoes`, `metas`, `patrimonio`, `notas`, `categoria-transacoes`, `parametros`) has its own migrations list colocated with (or next to) its repository file.
- [x] Each migration's SQL lives in its own `.sql` file, loaded via a build-time raw import.
- [x] A single ordered manifest/registry still exists, making cross-repository ordering (e.g. `categoria_transacoes` before `transacoes`' FK migration) explicit and documented.
- [x] Migration `name` values used for the `migrations` tracking table are unchanged from today (so existing users' local databases don't re-run already-applied migrations).
- [x] `runMigrations()` (or its replacement) executes the full flattened, ordered list exactly as before, statement-for-statement equivalent.
- [x] Existing app behavior and schema end state are unchanged; adding a new migration in the future only requires adding a new `.sql` file + one line in the relevant repo's migration list (no touching a shared giant function).
