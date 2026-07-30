import { IDatabase } from "../database-connector";

// Executes a migration's raw SQL (imported at build time via the `.sql`
// webpack asset/source rule in next.config.js, or the Jest `.sql` transform
// for tests) against the given database connection.
export function importAndExec(db: IDatabase, sqlContent: string) {
  return db.exec(sqlContent);
}
