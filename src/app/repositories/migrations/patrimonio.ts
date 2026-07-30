import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import patrimonioCreateSaldosSql from "./sql/patrimonio/001_create_saldos.sql";
import patrimonioRenameSaldosToPatrimonioSql from "./sql/patrimonio/002_rename_saldos_to_patrimonio.sql";

export const PATRIMONIO_MIGRATIONS: Migration[] = [
  { name: "saldos", run: (db) => importAndExec(db, patrimonioCreateSaldosSql) },
  { name: "rename_saldos_to_patrimonio", run: (db) => importAndExec(db, patrimonioRenameSaldosToPatrimonioSql) },
];
