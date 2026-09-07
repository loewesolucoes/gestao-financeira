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

    // The pre-refactor snapshot only covers migrations that existed at the
    // time of the refactor (spec 001). Migrations added afterwards (e.g. spec
    // 006's "emprestimos"/"emprestimo_parcelas") are expected to be appended
    // after that point, so this asserts the historical slice is an untouched,
    // ordered prefix rather than the full, ever-growing list.
    expect(names.slice(0, migrationsSnapshot.orderedMigrationNames.length)).toEqual(
      migrationsSnapshot.orderedMigrationNames
    );
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
