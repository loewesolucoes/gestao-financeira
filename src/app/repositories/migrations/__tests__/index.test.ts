import { ALL_MIGRATIONS } from "..";
import migrationsSnapshot from "../../__tests__/fixtures/migrations-snapshot.json";

// Direct, DB-less unit test on the ALL_MIGRATIONS list itself (as opposed to
// ../../__tests__/migrations.test.ts and migrations-fixture-regression.test.ts,
// which assert the *effect* of running migrations against a real sql.js
// database). This test catches ordering/name mistakes immediately, without
// needing to spin up sql.js, whenever ALL_MIGRATIONS is edited.
describe("ALL_MIGRATIONS", () => {
  it("declares migration names in the exact historical order captured in the pre-refactor snapshot", () => {
    const names = ALL_MIGRATIONS.map((migration) => migration.name);

    expect(names).toEqual(migrationsSnapshot.orderedMigrationNames);
  });

  it("never has duplicate migration names", () => {
    const names = ALL_MIGRATIONS.map((migration) => migration.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("places categoria_transacoes before its transacoes foreign key migration", () => {
    const names = ALL_MIGRATIONS.map((migration) => migration.name);

    const categoriaIndex = names.indexOf("categoria_transacoes");
    const fkIndex = names.indexOf("categoria_transacoes_chave_estrangeira");

    expect(categoriaIndex).toBeGreaterThanOrEqual(0);
    expect(fkIndex).toBeGreaterThan(categoriaIndex);
  });

  it("exposes every migration as a runnable function", () => {
    expect(ALL_MIGRATIONS.length).toBeGreaterThan(0);
    ALL_MIGRATIONS.forEach((migration) => {
      expect(typeof migration.name).toBe("string");
      expect(migration.name.length).toBeGreaterThan(0);
      expect(typeof migration.run).toBe("function");
    });
  });
});
