import initSqlJs, { Database } from "sql.js";
import { DefaultRepository } from "../default";
import { IDatabase } from "../database-connector";
import migrationsSnapshot from "./fixtures/migrations-snapshot.json";

// The baseline test (spec 001 / T1-T2): run TODAY's runMigrations() against a
// fresh in-memory sql.js DB and assert it produces exactly the schema and
// migration name list captured in fixtures/migrations-snapshot.json (see
// generation notes in specs/001-repository-migrations-refactor/tasks.md).
//
// This test must keep passing, UNCHANGED, after the migrations refactor
// (T3-T7) — it is the regression harness proving statement-for-statement
// equivalence, not something rewritten to match the new code.

jest.mock("localforage", () => ({
  setItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
}));

// Minimal IDatabase implementation backed directly by an in-memory sql.js
// Database (no worker/BroadcastChannel involved), mirroring exactly what
// sql.js's own worker.sql-wasm.js does for the "exec" action: `db.exec(sql, params)`.
class InMemorySqlJsDatabase implements IDatabase {
  public constructor(private readonly sqlJsDb: Database) { }

  public async exec(sql: string, params?: any) {
    return this.sqlJsDb.exec(sql, params);
  }

  public async export() {
    return this.sqlJsDb.export();
  }

  public async open() {
    // no-op: the sql.js Database is already open/instantiated by the caller
    return undefined;
  }
}

function querySchema(sqlJsDb: Database) {
  const tables = sqlJsDb.exec(
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
  );
  const tableRows = tables[0] ? tables[0].values : [];
  const schema: Record<string, { createSql: string; columns: any[] }> = {};

  for (const [name, sql] of tableRows) {
    const cols = sqlJsDb.exec(`PRAGMA table_info("${name}")`);

    schema[name as string] = {
      createSql: sql as string,
      columns: (cols[0] ? cols[0].values : []).map((v) => ({
        name: v[1],
        type: v[2],
        notnull: v[3],
        dflt_value: v[4],
        pk: v[5],
      })),
    };
  }

  return schema;
}

describe("runMigrations() baseline (spec 001 regression harness)", () => {
  it("produces the exact schema and ordered migration name list from the pre-refactor snapshot", async () => {
    const SQL = await initSqlJs();
    const sqlJsDb = new SQL.Database();
    const db = new InMemorySqlJsDatabase(sqlJsDb);
    const repo = new DefaultRepository(db);

    // runMigrations() is `protected`; call it the same way RepositoryUtil does.
    // @ts-ignore
    await repo.runMigrations();

    const migrationsResult = sqlJsDb.exec(`SELECT name FROM "migrations" ORDER BY "id"`);
    const migrationNames = (migrationsResult[0] ? migrationsResult[0].values : []).map((v) => v[0]);

    expect(migrationNames).toEqual(migrationsSnapshot.orderedMigrationNames);

    const schema = querySchema(sqlJsDb);

    expect(Object.keys(schema).sort()).toEqual(Object.keys(migrationsSnapshot.schema).sort());

    for (const tableName of Object.keys(migrationsSnapshot.schema)) {
      expect(schema[tableName].columns).toEqual(
        (migrationsSnapshot.schema as any)[tableName].columns
      );
    }

    const fkResult = sqlJsDb.exec(`PRAGMA foreign_key_list("transacoes")`);
    const foreignKeys = fkResult[0] ? fkResult[0].values : [];

    expect(foreignKeys).toEqual(migrationsSnapshot.transacoesForeignKeys);
  });
});
