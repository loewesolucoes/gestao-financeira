import fs from "fs";
import path from "path";
import initSqlJs, { Database } from "sql.js";
import { DefaultRepository } from "../default";
import { IDatabase } from "../database-connector";
import migrationsSnapshot from "./fixtures/migrations-snapshot.json";

// T8 (manual/regression pass): load the T1 real exported pre-refactor sqlite
// fixture into the REFACTORED runMigrations() and confirm zero migrations
// re-run — i.e. an existing user's persisted database, already fully
// migrated before this refactor, is left untouched by it.

jest.mock("localforage", () => ({
  setItem: jest.fn(async () => undefined),
  getItem: jest.fn(async () => null),
}));

class InMemorySqlJsDatabase implements IDatabase {
  public constructor(private readonly sqlJsDb: Database) { }

  public async exec(sql: string, params?: any) {
    return this.sqlJsDb.exec(sql, params);
  }

  public async export() {
    return this.sqlJsDb.export();
  }

  public async open() {
    return undefined;
  }
}

describe("runMigrations() against a real pre-refactor exported DB fixture", () => {
  it("does not re-run any already-applied migration", async () => {
    const fixturePath = path.join(__dirname, "fixtures", "pre-refactor.sqlite");
    const fixtureBytes = fs.readFileSync(fixturePath);

    const SQL = await initSqlJs();
    const sqlJsDb = new SQL.Database(fixtureBytes);

    const before = sqlJsDb.exec(`SELECT name FROM "migrations" ORDER BY "id"`);
    const namesBefore = (before[0] ? before[0].values : []).map((v) => v[0]);

    expect(namesBefore).toEqual(migrationsSnapshot.orderedMigrationNames);

    const db = new InMemorySqlJsDatabase(sqlJsDb);
    const repo = new DefaultRepository(db);

    // @ts-ignore — runMigrations() is protected, same call RepositoryUtil makes.
    await repo.runMigrations();

    const after = sqlJsDb.exec(`SELECT name FROM "migrations" ORDER BY "id"`);
    const namesAfter = (after[0] ? after[0].values : []).map((v) => v[0]);

    // No new rows: the fixture was already fully migrated, so re-running
    // runMigrations() against it must be a no-op for the migrations table.
    expect(namesAfter).toEqual(namesBefore);
  });
});
