import BigNumber from "bignumber.js";
import moment from "moment";
import { DefaultRepository, MapperTypes, TableNames } from "../default";
import { IDatabase } from "../database-connector";
import { RepositoryUtil } from "../../utils/repository";

jest.mock("../../utils/repository", () => ({
  RepositoryUtil: {
    persistLocalDump: jest.fn(async () => { }),
    generateDumpFromExport: jest.fn(() => "fake-dump"),
  },
}));

function createDbMock(): jest.Mocked<IDatabase> {
  return {
    exec: jest.fn(),
    export: jest.fn(async () => new Uint8Array()),
    open: jest.fn(async () => ({})),
  };
}

describe("DefaultRepository", () => {
  let db: jest.Mocked<IDatabase>;
  let repository: DefaultRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createDbMock();
    repository = new DefaultRepository(db);
  });

  describe("save", () => {
    it("insere um novo registro quando não há id (insert path)", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([{ columns: ["LAST_INSERT_ROWID()"], values: [[42]] }]);

      const result = await repository.save(TableNames.NOTAS, { descricao: "Nota nova" });

      expect(db.exec).toHaveBeenCalledTimes(1);
      const [command, params] = (db.exec as jest.Mock).mock.calls[0];

      expect(command).toContain(`INSERT INTO ${TableNames.NOTAS}`);
      expect(command).toContain("SELECT LAST_INSERT_ROWID()");
      expect(params.$descricao).toBe("Nota nova");
      expect(params.$createdDate).toBeDefined();

      expect(result.id).toBe(42);
      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });

    it("serializa Date via moment().format() e BigNumber via .toNumber() no insert", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([{ columns: ["LAST_INSERT_ROWID()"], values: [[1]] }]);

      const data = new Date(2024, 5, 1);
      await repository.save(TableNames.TRANSACOES, { data, valor: BigNumber(123.45) });

      const [, params] = (db.exec as jest.Mock).mock.calls[0];

      expect(params.$data).toBe(moment(data).format());
      expect(params.$valor).toBe(123.45);
    });

    it("atualiza um registro existente quando há id (update path) e busca o registro atualizado", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([]) // UPDATE ... command
        .mockResolvedValueOnce([{ columns: ["id", "descricao"], values: [[1, "Nota atualizada"]] }]); // get() follow-up

      const result = await repository.save(TableNames.NOTAS, { id: 1, descricao: "Nota atualizada" });

      expect(db.exec).toHaveBeenCalledTimes(2);

      const [updateCommand, updateParams] = (db.exec as jest.Mock).mock.calls[0];
      expect(updateCommand).toContain(`UPDATE ${TableNames.NOTAS} SET`);
      expect(updateCommand).toContain("WHERE id=$id");
      expect(updateParams.$descricao).toBe("Nota atualizada");
      expect(updateParams.$updatedDate).toBeDefined();

      const [getCommand, getParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(getCommand).toContain(`select * from ${TableNames.NOTAS} where id = $id`);
      expect(getParams.$id).toBe(1);

      expect(result.descricao).toBe("Nota atualizada");
      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });
  });

  describe("delete", () => {
    it("executa o comando de exclusão e persiste o banco", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      await repository.delete(TableNames.METAS, 7);

      expect(db.exec).toHaveBeenCalledWith(`delete from ${TableNames.METAS} where id = $id`, { "$id": 7 });
      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });
  });

  describe("list", () => {
    it("retorna a lista de registros mapeados", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["id", "descricao"], values: [[1, "A"], [2, "B"]] },
      ]);

      const result = await repository.list<any>(TableNames.NOTAS);

      expect(db.exec).toHaveBeenCalledWith(`SELECT * FROM ${TableNames.NOTAS} order by createdDate desc`);
      expect(result).toEqual([{ id: 1, descricao: "A" }, { id: 2, descricao: "B" }]);
    });

    it("lança erro quando o resultado não é um array", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce(undefined as any);

      await expect(repository.list<any>(TableNames.NOTAS)).rejects.toThrow(`${TableNames.NOTAS} não encontrado (a)`);
    });
  });

  describe("get", () => {
    it("retorna um único registro mapeado", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["id", "descricao"], values: [[1, "A"]] },
      ]);

      const result = await repository.get<any>(TableNames.NOTAS, "1");

      expect(db.exec).toHaveBeenCalledWith(`select * from ${TableNames.NOTAS} where id = $id`, { "$id": "1" });
      expect(result).toEqual({ id: 1, descricao: "A" });
    });

    it("lança erro quando não encontra o registro", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      await expect(repository.get<any>(TableNames.NOTAS, "999")).rejects.toThrow(`${TableNames.NOTAS} não encontrado (a)`);
    });
  });

  describe("parseSqlResultToObj (mapper types)", () => {
    it("mapeia MapperTypes.DATE usando moment com formato YYYY-MM-DD", () => {
      const fakeResult = [{ columns: ["id", "data"], values: [[1, "2024-06-01"]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, { data: MapperTypes.DATE });

      expect(row.data).toEqual(moment("2024-06-01", "YYYY-MM-DD").toDate());
    });

    it("mapeia MapperTypes.DATE_TIME usando moment com formato YYYY-MM-DD hh:mm:ss", () => {
      const fakeResult = [{ columns: ["id", "createdDate"], values: [[1, "2024-06-01 10:30:00"]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, { createdDate: MapperTypes.DATE_TIME });

      expect(row.createdDate).toEqual(moment("2024-06-01 10:30:00", "YYYY-MM-DD hh:mm:ss").toDate());
    });

    it("mapeia MapperTypes.NUMBER mantendo o valor original (sem BigNumber)", () => {
      const fakeResult = [{ columns: ["id", "tipo"], values: [[1, 2]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, { tipo: MapperTypes.NUMBER });

      expect(row.tipo).toBe(2);
      expect(row.tipo).not.toBeInstanceOf(BigNumber);
    });

    it("mapeia MapperTypes.BOOLEAN convertendo valores truthy/falsy para boolean", () => {
      const fakeResult = [{ columns: ["id", "active"], values: [[1, 1], [2, 0]] }] as initSqlJs.QueryExecResult[];

      const [rows] = (repository as any).parseSqlResultToObj(fakeResult, { active: MapperTypes.BOOLEAN });

      expect(rows[0].active).toBe(true);
      expect(rows[1].active).toBe(false);
    });

    it("mapeia MapperTypes.IGNORE removendo o campo do resultado", () => {
      const fakeResult = [{ columns: ["id", "monthYear"], values: [[1, "2024-06"]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, { monthYear: MapperTypes.IGNORE });

      expect(row).not.toHaveProperty("monthYear");
    });

    it("usa BigNumber como fallback para colunas numéricas sem mapeamento explícito", () => {
      const fakeResult = [{ columns: ["id", "valor"], values: [[1, 150.5]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, {});

      expect(row.valor).toBeInstanceOf(BigNumber);
      expect((row.valor as BigNumber).toNumber()).toBe(150.5);
    });

    it("mantém o valor original quando não há mapeamento e o valor não é numérico", () => {
      const fakeResult = [{ columns: ["id", "descricao"], values: [[1, "texto"]] }] as initSqlJs.QueryExecResult[];

      const [[row]] = (repository as any).parseSqlResultToObj(fakeResult, {});

      expect(row.descricao).toBe("texto");
    });
  });
});
