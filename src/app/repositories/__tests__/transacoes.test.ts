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
    it("faz uma única chamada ao banco e calcula a diferença positiva (patrimônio acima do caixa)", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[1000]] },
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [["2024-06", 500, 1000]] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-06", 1500]] },
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
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-07", 1200]] },
      ]);

      const result = await repository.totaisCaixa();

      expect((result.diferencaPatrimonioCaixa as BigNumber).toNumber()).toBe(-800);
    });

    it("retorna campos de patrimônio undefined quando não há registros de patrimonio", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[1000]] },
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [] },
      ]);

      const result = await repository.totaisCaixa();

      expect(result.mesPatrimonio).toBeUndefined();
      expect(result.valorPatrimonio).toBeUndefined();
      expect(result.diferencaPatrimonioCaixa).toBeUndefined();
    });

    it("trata valorEmCaixa ausente (sem transações) como zero ao calcular a diferença", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        { columns: ["valorEmCaixa"], values: [[null]] }, // SUM sem linhas em transacoes retorna NULL
        { columns: ["mes", "totalMes", "totalAcumulado"], values: [] },
        { columns: ["mesPatrimonio", "valorPatrimonio"], values: [["2024-06", 1500]] },
      ]);

      const result = await repository.totaisCaixa();

      expect(result.valorEmCaixa).toBeNull();
      expect((result.diferencaPatrimonioCaixa as BigNumber).toNumber()).toBe(1500);
    });
  });
});
