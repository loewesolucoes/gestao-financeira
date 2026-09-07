import fs from "fs";
import path from "path";
import initSqlJs, { Database } from "sql.js";
import { DefaultRepository } from "../default";
import { IDatabase } from "../database-connector";
import { ALL_MIGRATIONS } from "../migrations";
import migrationsSnapshot from "./fixtures/migrations-snapshot.json";

// T8 (manual/regression pass): load the T1 real exported pre-refactor sqlite
// fixture into the REFACTORED runMigrations() and confirm already-applied
// migrations are left untouched — i.e. an existing user's persisted
// database, already migrated up to the spec 001 refactor, doesn't have its
// historical migration rows altered or re-run. Migrations added after the
// refactor (e.g. spec 006) are expected to run for the first time against
// this older fixture, exactly like they would for a real user upgrading.

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
  it("does not alter already-applied historical migrations, and correctly runs newly added ones", async () => {
    const fixturePath = path.join(__dirname, "fixtures", "pre-refactor.sqlite");
    const fixtureBytes = fs.readFileSync(fixturePath);

    const SQL = await initSqlJs();
    const sqlJsDb = new SQL.Database(fixtureBytes);

    const before = sqlJsDb.exec(`SELECT name FROM "migrations" ORDER BY "id"`);
    const namesBefore = (before[0] ? before[0].values : []).map((v) => v[0]);

    // The fixture predates the `notificacoes` migrations (spec 011), so it
    // only has the migrations up to that point already applied.
    const preExistingMigrationNames = migrationsSnapshot.orderedMigrationNames.filter(
      (name) => !["notificacoes", "notificacoes_seed_mensagens"].includes(name)
    );

    expect(namesBefore).toEqual(preExistingMigrationNames);

    const db = new InMemorySqlJsDatabase(sqlJsDb);
    const repo = new DefaultRepository(db);

    // @ts-ignore — runMigrations() is protected, same call RepositoryUtil makes.
    await repo.runMigrations();

    const after = sqlJsDb.exec(`SELECT name FROM "migrations" ORDER BY "id"`);
    const namesAfter = (after[0] ? after[0].values : []).map((v) => v[0]);

    // The pre-refactor.sqlite fixture only has migrations up to the spec 001
    // refactor recorded. Migrations added afterwards (e.g. spec 006's
    // "emprestimos"/"emprestimo_parcelas") are new to this fixture and are
    // expected to run for the first time — this asserts the historical rows
    // are left untouched (still the exact prefix) while newly introduced
    // migrations are correctly appended, in order, after them.
    expect(namesAfter.slice(0, namesBefore.length)).toEqual(namesBefore);
    expect(namesAfter.slice(namesBefore.length)).toEqual(
      ALL_MIGRATIONS.map((migration) => migration.name).slice(namesBefore.length)
    );
  });
});
