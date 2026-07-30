import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import notasCreateSql from "./sql/notas/001_create.sql";
import notasAddTipoEComentarioSql from "./sql/notas/002_add_tipo_e_comentario.sql";

export const NOTAS_MIGRATIONS: Migration[] = [
  { name: "notas", run: (db) => importAndExec(db, notasCreateSql) },
  { name: "notas_campo_comentario_e_tipo", run: (db) => importAndExec(db, notasAddTipoEComentarioSql) },
];
