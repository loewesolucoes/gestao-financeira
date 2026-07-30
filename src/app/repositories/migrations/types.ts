import { IDatabase } from "../database-connector";

// A single guarded schema migration. `name` is the stable id stored in the
// `migrations` tracking table — for migrations that already shipped, this
// MUST match the exact string used today in default.ts#runMigrations(), or
// existing users' persisted databases would re-run already-applied
// migrations.
export interface Migration {
  name: string;
  run: (db: IDatabase) => Promise<unknown> | void;
}
