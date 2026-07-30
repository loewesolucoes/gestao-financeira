import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import transacoesCreateSql from "./sql/transacoes/001_create.sql";
import transacoesAddOrdemColumnSql from "./sql/transacoes/002_add_ordem_column.sql";
import transacoesAddCategoriaFkSql from "./sql/transacoes/003_add_categoria_fk.sql";

export const TRANSACOES_MIGRATIONS: Migration[] = [
  { name: "transacoes", run: (db) => importAndExec(db, transacoesCreateSql) },
  { name: "transacoes_campo_ordem", run: (db) => importAndExec(db, transacoesAddOrdemColumnSql) },
];

// Kept as a separate exported list (not merged into TRANSACOES_MIGRATIONS)
// so registry.ts can place it after CATEGORIA_TRANSACOES_MIGRATIONS — this
// migration adds a FK on "transacoes" referencing "categoria_transacoes",
// which must already exist, while still preserving the exact original
// migration order/history (categoria_transacoes historically ran after
// transacoes/patrimonio/notas/metas were already created).
export const TRANSACOES_CATEGORIA_FK_MIGRATIONS: Migration[] = [
  { name: "categoria_transacoes_chave_estrangeira", run: (db) => importAndExec(db, transacoesAddCategoriaFkSql) },
];
