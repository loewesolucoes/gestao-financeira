import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import metasCreateSql from "./sql/metas/001_create.sql";

export const METAS_MIGRATIONS: Migration[] = [
  { name: "metas", run: (db) => importAndExec(db, metasCreateSql) },
];
