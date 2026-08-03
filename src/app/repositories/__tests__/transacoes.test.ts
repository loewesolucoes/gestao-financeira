import BigNumber from "bignumber.js";
import { TransacoesRepository } from "../transacoes";
import { IDatabase } from "../database-connector";

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

describe("TransacoesRepository", () => {
  let db: jest.Mocked<IDatabase>;
  let repository: TransacoesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createDbMock();
    repository = new TransacoesRepository(db);
  });

  describe("totaisCaixa", () => {
    // Nota importante sobre estes mocks: sql.js's `db.exec()` só inclui uma
    // entrada no array retornado para statements que retornam ao menos 1
    // linha — um SELECT com GROUP BY que não bate nenhuma linha (ex.:
    // tabela vazia) NÃO aparece no array (não é uma entrada com
    // `values: []`, ela simplesmente não existe). Os mocks abaixo replicam
    // esse comportamento fielmente para pegar regressões de index shifting.

    it("faz uma única chamada ao banco e calcula a diferença positiva (patrimônio acima do caixa)", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[1000]] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-06", 1500]] },
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [["2024-06", 500, 1000]] },
      ]);

      const result = await repository.totaisCaixa();

      expect(db.exec).toHaveBeenCalledTimes(1);
      expect((result.valorEmCaixa as BigNumber).toNumber()).toBe(1000);
      expect(result.transacoesAcumuladaPorMes).toHaveLength(1);
      expect(result.mesPatrimonio).toBe("2024-06");
      expect((result.valorPatrimonio as BigNumber).toNumber()).toBe(1500);
      expect((result.diferencaPatrimonioCaixa as BigNumber).toNumber()).toBe(500);
    });

    it("calcula a diferença negativa (patrimônio abaixo do caixa)", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[2000]] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-07", 1200]] },
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [["2024-07", -800, 2000]] },
      ]);

      const result = await repository.totaisCaixa();

      expect((result.diferencaPatrimonioCaixa as BigNumber).toNumber()).toBe(-800);
    });

    it("não lança erro e retorna campos de patrimônio undefined quando patrimonio e transacoes estão vazias", async () => {
      // Sem nenhuma linha em `patrimonio` ou `transacoes`: a query de
      // patrimônio ainda retorna 1 linha (mesPatrimonio/valorPatrimonio
      // NULL) graças ao LEFT JOIN contra uma subquery de 1 linha garantida.
      // A query de `transacoesAcumuladaPorMes` (GROUP BY) retorna 0 linhas
      // e, por isso, nem aparece no array de resultados do sql.js.
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[null]] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [[null, null]] },
      ]);

      const result = await repository.totaisCaixa();

      expect(result.mesPatrimonio).toBeNull();
      expect(result.valorPatrimonio).toBeNull();
      expect(result.diferencaPatrimonioCaixa).toBeUndefined();
      expect(result.transacoesAcumuladaPorMes).toEqual([]);
    });

    it("trata valorEmCaixa ausente (sem transações) como zero, mesmo quando a query de transacoesAcumuladaPorMes some do resultado", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[null]] }, // SUM sem linhas em transacoes retorna NULL
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-06", 1500]] },
        // sem entrada para transacoesAcumuladaPorMes: transacoes vazia -> 0 grupos -> sql.js não inclui o result set
      ]);

      const result = await repository.totaisCaixa();

      expect(result.valorEmCaixa).toBeNull();
      expect((result.diferencaPatrimonioCaixa as BigNumber).toNumber()).toBe(1500);
      expect(result.transacoesAcumuladaPorMes).toEqual([]);
    });
  });
});
