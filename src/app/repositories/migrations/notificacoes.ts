import { Migration } from "./types";
import { importAndExec } from "./load-sql";
import notificacoesCreateSql from "./sql/notificacoes/001_create.sql";
import notificacoesSeedMensagensSql from "./sql/notificacoes/002_seed_mensagens.sql";

export const NOTIFICACOES_MIGRATIONS: Migration[] = [
  { name: "notificacoes", run: (db) => importAndExec(db, notificacoesCreateSql) },
  { name: "notificacoes_seed_mensagens", run: (db) => importAndExec(db, notificacoesSeedMensagensSql) },
];
