import { IDatabase } from "../database-connector";

import parametrosCreateSql from "./sql/parametros/001_create.sql";

import transacoesCreateSql from "./sql/transacoes/001_create.sql";
import transacoesAddOrdemColumnSql from "./sql/transacoes/002_add_ordem_column.sql";
import transacoesAddCategoriaFkSql from "./sql/transacoes/003_add_categoria_fk.sql";

import patrimonioCreateSaldosSql from "./sql/patrimonio/001_create_saldos.sql";
import patrimonioRenameSaldosToPatrimonioSql from "./sql/patrimonio/002_rename_saldos_to_patrimonio.sql";

import notasCreateSql from "./sql/notas/001_create.sql";
import notasAddTipoEComentarioSql from "./sql/notas/002_add_tipo_e_comentario.sql";

import metasCreateSql from "./sql/metas/001_create.sql";

import categoriaTransacoesCreateSql from "./sql/categoria-transacoes/001_create.sql";

// A single guarded schema migration. `name` is the stable id stored in the
// `migrations` tracking table — for migrations that already shipped, this
// MUST match the exact string used historically in
// default.ts#runMigrations(), or existing users' persisted databases would
// re-run already-applied migrations.
export interface Migration {
  name: string;
  run: (db: IDatabase) => Promise<unknown> | void;
}

// Executes a migration's raw SQL (imported at build time via the `.sql`
// webpack asset/source rule in next.config.js, or the Jest `.sql` transform
// for tests) against the given database connection.
function importAndExec(db: IDatabase, sqlContent: string) {
  return db.exec(sqlContent);
}

// Single, explicit, ordered list of every migration across all repositories.
// All tables live in one SQLite database, so cross-repository ordering
// dependencies must stay visible here even though the migrations below are
// grouped by the repository/table they belong to.
//
// This exact order (including where the "categoria_transacoes" and
// "categoria_transacoes_chave_estrangeira" migrations sit, at the very end)
// reproduces the historical order migrations ran in
// default.ts#runMigrations() prior to the repository-scoped refactor — this
// matters for the `migrations` tracking table's row order, which the
// regression tests in `__tests__` assert against a pre-refactor snapshot.
//
// Order matters: "categoria_transacoes_chave_estrangeira" must run after
// "categoria_transacoes", because it adds a foreign key on "transacoes"
// referencing the "categoria_transacoes" table, which must already exist.
export const ALL_MIGRATIONS: Migration[] = [
  // parametros
  { name: "parametros", run: (db) => importAndExec(db, parametrosCreateSql) },

  // transacoes
  { name: "transacoes", run: (db) => importAndExec(db, transacoesCreateSql) },
  { name: "transacoes_campo_ordem", run: (db) => importAndExec(db, transacoesAddOrdemColumnSql) },

  // patrimonio (originally "saldos")
  { name: "saldos", run: (db) => importAndExec(db, patrimonioCreateSaldosSql) },
  { name: "rename_saldos_to_patrimonio", run: (db) => importAndExec(db, patrimonioRenameSaldosToPatrimonioSql) },

  // notas
  { name: "notas", run: (db) => importAndExec(db, notasCreateSql) },
  { name: "notas_campo_comentario_e_tipo", run: (db) => importAndExec(db, notasAddTipoEComentarioSql) },

  // metas
  { name: "metas", run: (db) => importAndExec(db, metasCreateSql) },

  // categoria_transacoes (historically created after transacoes/patrimonio/notas/metas)
  { name: "categoria_transacoes", run: (db) => importAndExec(db, categoriaTransacoesCreateSql) },

  // transacoes -> categoria_transacoes foreign key (must run after categoria_transacoes exists)
  { name: "categoria_transacoes_chave_estrangeira", run: (db) => importAndExec(db, transacoesAddCategoriaFkSql) },
];
