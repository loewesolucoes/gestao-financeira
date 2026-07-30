import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import categoriaTransacoesCreateSql from "./sql/categoria-transacoes/001_create.sql";

export const CATEGORIA_TRANSACOES_MIGRATIONS: Migration[] = [
  { name: "categoria_transacoes", run: (db) => importAndExec(db, categoriaTransacoesCreateSql) },
];
