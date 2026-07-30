import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import parametrosCreateSql from "./sql/parametros/001_create.sql";

export const PARAMETROS_MIGRATIONS: Migration[] = [
  { name: "parametros", run: (db) => importAndExec(db, parametrosCreateSql) },
];
