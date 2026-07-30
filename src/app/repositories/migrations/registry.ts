import { Migration } from "./types";
import { PARAMETROS_MIGRATIONS } from "./parametros";
import { CATEGORIA_TRANSACOES_MIGRATIONS } from "./categoria-transacoes";
import { TRANSACOES_MIGRATIONS, TRANSACOES_CATEGORIA_FK_MIGRATIONS } from "./transacoes";
import { PATRIMONIO_MIGRATIONS } from "./patrimonio";
import { NOTAS_MIGRATIONS } from "./notas";
import { METAS_MIGRATIONS } from "./metas";

// Single, explicit, ordered list of every migration across all repositories.
// All tables live in one SQLite database, so cross-repository ordering
// dependencies must stay visible here even though each repository owns its
// own migration list.
//
// This exact order (including where CATEGORIA_TRANSACOES_MIGRATIONS and
// TRANSACOES_CATEGORIA_FK_MIGRATIONS sit) reproduces the historical order
// migrations ran in default.ts#runMigrations() prior to this refactor — this
// matters for the `migrations` tracking table's row order, which the T2/T7
// regression tests assert against a pre-refactor snapshot.
//
// Order matters: TRANSACOES_CATEGORIA_FK_MIGRATIONS must run after
// CATEGORIA_TRANSACOES_MIGRATIONS, because it adds a foreign key on
// "transacoes" referencing the "categoria_transacoes" table, which must
// already exist.
export const ALL_MIGRATIONS: Migration[] = [
  ...PARAMETROS_MIGRATIONS,
  ...TRANSACOES_MIGRATIONS,
  ...PATRIMONIO_MIGRATIONS,
  ...NOTAS_MIGRATIONS,
  ...METAS_MIGRATIONS,
  ...CATEGORIA_TRANSACOES_MIGRATIONS,
  ...TRANSACOES_CATEGORIA_FK_MIGRATIONS,
];
