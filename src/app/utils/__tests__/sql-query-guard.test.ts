import { sanitizeReadOnlyQuery, SqlQueryGuardError, ALLOWED_TABLES } from "../sql-query-guard";

describe("sanitizeReadOnlyQuery", () => {
  it("aceita uma consulta SELECT simples em tabela permitida", () => {
    expect(sanitizeReadOnlyQuery("SELECT * FROM transacoes")).toBe("SELECT * FROM transacoes LIMIT 200");
  });

  it("aceita uma consulta WITH ... SELECT", () => {
    const sql = "WITH totais AS (SELECT valor FROM transacoes) SELECT * FROM totais";
    expect(sanitizeReadOnlyQuery(sql)).toBe(`${sql} LIMIT 200`);
  });

  it("não duplica o LIMIT se já existir", () => {
    expect(sanitizeReadOnlyQuery("SELECT * FROM transacoes LIMIT 10")).toBe("SELECT * FROM transacoes LIMIT 10");
  });

  it("remove o ponto e vírgula final antes de anexar o LIMIT", () => {
    expect(sanitizeReadOnlyQuery("SELECT * FROM transacoes;")).toBe("SELECT * FROM transacoes LIMIT 200");
  });

  it("permite consultas com JOIN entre tabelas permitidas", () => {
    const sql = "SELECT t.valor, c.descricao FROM transacoes t JOIN categoria_transacoes c ON c.id = t.categoriaId";
    expect(sanitizeReadOnlyQuery(sql)).toBe(`${sql} LIMIT 200`);
  });

  it.each(ALLOWED_TABLES)("permite consultar a tabela permitida %s", (table) => {
    expect(() => sanitizeReadOnlyQuery(`SELECT * FROM ${table}`)).not.toThrow();
  });

  it("rejeita string vazia", () => {
    expect(() => sanitizeReadOnlyQuery("")).toThrow(SqlQueryGuardError);
  });

  it("rejeita consultas que não começam com SELECT/WITH", () => {
    expect(() => sanitizeReadOnlyQuery("EXPLAIN SELECT * FROM transacoes")).toThrow(SqlQueryGuardError);
  });

  it("rejeita múltiplas instruções", () => {
    expect(() => sanitizeReadOnlyQuery("SELECT * FROM transacoes; SELECT * FROM metas")).toThrow(SqlQueryGuardError);
  });

  it.each(["INSERT INTO transacoes (valor) VALUES (1)", "UPDATE transacoes SET valor = 1", "DELETE FROM transacoes",
    "DROP TABLE transacoes", "ALTER TABLE transacoes ADD COLUMN x TEXT", "ATTACH DATABASE 'x' AS y",
    "PRAGMA table_info(transacoes)", "VACUUM", "CREATE TABLE x (id INTEGER)"])(
    "rejeita instrução DML/DDL/PRAGMA: %s", (sql) => {
      expect(() => sanitizeReadOnlyQuery(sql)).toThrow(SqlQueryGuardError);
    });

  it("rejeita referência explícita à tabela parametros", () => {
    expect(() => sanitizeReadOnlyQuery("SELECT * FROM parametros")).toThrow(SqlQueryGuardError);
  });

  it("rejeita referência explícita à tabela migrations", () => {
    expect(() => sanitizeReadOnlyQuery("SELECT * FROM migrations")).toThrow(SqlQueryGuardError);
  });

  it("rejeita tabela não listada no allowlist mesmo sem ser parametros/migrations", () => {
    expect(() => sanitizeReadOnlyQuery("SELECT * FROM sqlite_master")).toThrow(SqlQueryGuardError);
  });

  it("rejeita JOIN com tabela não permitida", () => {
    const sql = "SELECT * FROM transacoes t JOIN parametros p ON p.id = t.categoriaId";
    expect(() => sanitizeReadOnlyQuery(sql)).toThrow(SqlQueryGuardError);
  });
});
