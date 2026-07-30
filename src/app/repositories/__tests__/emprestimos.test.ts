import BigNumber from "bignumber.js";
import moment from "moment";
import { EmprestimosRepository, TipoDeEmprestimo, StatusEmprestimo } from "../emprestimos";
import { TableNames } from "../default";
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

function parcelasResult(parcelas: any[]) {
  const columns = ["id", "emprestimoId", "numero", "valor", "dataVencimento", "pago", "dataPagamento", "createdDate", "updatedDate"];

  return [{
    columns,
    values: parcelas.map(p => columns.map(c => p[c] ?? null)),
  }];
}

describe("EmprestimosRepository", () => {
  let db: jest.Mocked<IDatabase>;
  let repository: EmprestimosRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createDbMock();
    repository = new EmprestimosRepository(db);
  });

  describe("criarComParcelas", () => {
    it("gera parcelas com valor igualmente dividido e datas mensais a partir de dataInicio", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["LAST_INSERT_ROWID()"], values: [[10]] }]) // insert emprestimo
        .mockResolvedValueOnce([]) // saveAll transaction (parcelas)
        .mockResolvedValueOnce(parcelasResult([
          { id: 1, emprestimoId: 10, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 0 },
          { id: 2, emprestimoId: 10, numero: 2, valor: 100, dataVencimento: "2024-02-01 00:00:00", pago: 0 },
        ])); // listParcelasByEmprestimo

      const dataInicio = moment("2024-01-01").toDate();

      const result = await repository.criarComParcelas({
        tipo: TipoDeEmprestimo.EMPRESTEI,
        pessoa: "João",
        valorTotal: BigNumber(200),
        numeroParcelas: 2,
        dataInicio,
      } as any);

      expect(result.id).toBe(10);
      expect(result.parcelas).toHaveLength(2);
      expect(result.status).toBe(StatusEmprestimo.ATIVO);

      // check the parcelas passed to saveAll (2nd exec call)
      const [, saveAllParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(saveAllParams.$valor0).toBe(100);
      expect(saveAllParams.$valor1).toBe(100);
      expect(saveAllParams.$numero0).toBe(1);
      expect(saveAllParams.$numero1).toBe(2);
      expect(saveAllParams.$dataVencimento0).toBe(moment(dataInicio).format());
      expect(saveAllParams.$dataVencimento1).toBe(moment(dataInicio).add(1, 'months').format());
    });

    it("absorve resto de divisão não exata mantendo BigNumber consistente entre as parcelas", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["LAST_INSERT_ROWID()"], values: [[11]] }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(parcelasResult([]));

      await repository.criarComParcelas({
        tipo: TipoDeEmprestimo.TOMEI_EMPRESTADO,
        pessoa: "Maria",
        valorTotal: BigNumber(100),
        numeroParcelas: 3,
        dataInicio: new Date(),
      } as any);

      const [, saveAllParams] = (db.exec as jest.Mock).mock.calls[1];
      const valorParcela = BigNumber(100).dividedBy(3).toNumber();

      expect(saveAllParams.$valor0).toBeCloseTo(valorParcela);
      expect(saveAllParams.$valor1).toBeCloseTo(valorParcela);
      expect(saveAllParams.$valor2).toBeCloseTo(valorParcela);
    });

    it("lança erro quando numeroParcelas é inválido", async () => {
      await expect(repository.criarComParcelas({
        tipo: TipoDeEmprestimo.EMPRESTEI,
        valorTotal: BigNumber(100),
        numeroParcelas: 0,
        dataInicio: new Date(),
      } as any)).rejects.toThrow('Número de parcelas inválido');
    });
  });

  describe("listComParcelas / status derivado", () => {
    it("deriva ATIVO quando existe ao menos uma parcela não paga", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["id", "tipo", "pessoa", "valorTotal", "numeroParcelas", "dataInicio", "cancelado", "createdDate"], values: [[1, 0, "João", 200, 2, "2024-01-01 00:00:00", 0, "2024-01-01 00:00:00"]] }])
        .mockResolvedValueOnce(parcelasResult([
          { id: 1, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 1 },
          { id: 2, emprestimoId: 1, numero: 2, valor: 100, dataVencimento: "2024-02-01 00:00:00", pago: 0 },
        ]));

      const [emprestimo] = await repository.listComParcelas();

      expect(emprestimo.status).toBe(StatusEmprestimo.ATIVO);
    });

    it("deriva QUITADO quando todas as parcelas estão pagas", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["id", "tipo", "pessoa", "valorTotal", "numeroParcelas", "dataInicio", "cancelado", "createdDate"], values: [[1, 0, "João", 200, 2, "2024-01-01 00:00:00", 0, "2024-01-01 00:00:00"]] }])
        .mockResolvedValueOnce(parcelasResult([
          { id: 1, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 1 },
          { id: 2, emprestimoId: 1, numero: 2, valor: 100, dataVencimento: "2024-02-01 00:00:00", pago: 1 },
        ]));

      const [emprestimo] = await repository.listComParcelas();

      expect(emprestimo.status).toBe(StatusEmprestimo.QUITADO);
    });

    it("deriva CANCELADO independente do estado das parcelas", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["id", "tipo", "pessoa", "valorTotal", "numeroParcelas", "dataInicio", "cancelado", "createdDate"], values: [[1, 0, "João", 200, 2, "2024-01-01 00:00:00", 1, "2024-01-01 00:00:00"]] }])
        .mockResolvedValueOnce(parcelasResult([
          { id: 1, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 0 },
        ]));

      const [emprestimo] = await repository.listComParcelas();

      expect(emprestimo.status).toBe(StatusEmprestimo.CANCELADO);
    });
  });

  describe("marcarParcelaPaga", () => {
    it("marca a parcela como paga e define dataPagamento", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce(parcelasResult([{ id: 5, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 0 }])) // getParcela
        .mockResolvedValueOnce([]) // update
        .mockResolvedValueOnce(parcelasResult([{ id: 5, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 1, dataPagamento: "2024-01-05 00:00:00" }])); // getParcela (refetch)

      const result = await repository.marcarParcelaPaga(5, true);

      expect(result.pago).toBe(true);

      const [updateCommand, updateParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(updateCommand).toContain(`UPDATE ${TableNames.EMPRESTIMO_PARCELAS} SET`);
      expect(updateParams.$pago).toBe(true);
      expect(updateParams.$dataPagamento).toBeDefined();
    });

    it("desmarca a parcela limpando dataPagamento", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce(parcelasResult([{ id: 5, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 1 }]))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(parcelasResult([{ id: 5, emprestimoId: 1, numero: 1, valor: 100, dataVencimento: "2024-01-01 00:00:00", pago: 0 }]));

      await repository.marcarParcelaPaga(5, false);

      const [, updateParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(updateParams.$pago).toBe(false);
      expect(updateParams.$dataPagamento).toBeNull();
    });
  });

  describe("editarParcela", () => {
    it("atualiza valor/dataVencimento de uma única parcela sem afetar as demais", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce(parcelasResult([{ id: 2, emprestimoId: 1, numero: 2, valor: 100, dataVencimento: "2024-02-01 00:00:00", pago: 0 }])) // getParcela
        .mockResolvedValueOnce([]) // update
        .mockResolvedValueOnce(parcelasResult([{ id: 2, emprestimoId: 1, numero: 2, valor: 150, dataVencimento: "2024-03-01 00:00:00", pago: 0 }])); // refetch

      const novaData = moment("2024-03-01").toDate();
      const result = await repository.editarParcela(2, { valor: BigNumber(150), dataVencimento: novaData });

      expect(result.valor?.toNumber()).toBe(150);

      const [updateCommand, updateParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(updateCommand).toContain(`UPDATE ${TableNames.EMPRESTIMO_PARCELAS} SET`);
      expect(updateParams.$valor).toBe(150);
      expect(updateParams.$dataVencimento).toBe(moment(novaData).format());
      // sibling fields (numero/emprestimoId) preserved from the fetched parcela
      expect(updateParams.$numero).toBe(2);
      expect(updateParams.$emprestimoId).toBe(1);
    });
  });

  describe("cancelar", () => {
    it("marca o emprestimo como cancelado", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([{ columns: ["id", "tipo", "pessoa", "cancelado", "createdDate"], values: [[1, 0, "João", 0, "2024-01-01 00:00:00"]] }]) // get
        .mockResolvedValueOnce([]) // update
        .mockResolvedValueOnce([{ columns: ["id", "tipo", "pessoa", "cancelado", "createdDate"], values: [[1, 0, "João", 1, "2024-01-01 00:00:00"]] }]); // get follow-up

      const result = await repository.cancelar(1);

      expect(result.cancelado).toBe(true);

      const [, updateParams] = (db.exec as jest.Mock).mock.calls[1];
      expect(updateParams.$cancelado).toBe(true);
    });
  });

  describe("totaisDoMes", () => {
    it("soma e agrupa parcelas do mês por tipo, excluindo empréstimos cancelados", async () => {
      const columns = ["id", "emprestimoId", "numero", "valor", "dataVencimento", "pago", "dataPagamento", "createdDate", "updatedDate", "pessoa", "tipo"];
      (db.exec as jest.Mock).mockResolvedValueOnce([{
        columns,
        values: [
          [1, 10, 1, 100, "2024-06-01 00:00:00", 0, null, "2024-01-01 00:00:00", null, "João", TipoDeEmprestimo.EMPRESTEI],
          [2, 11, 1, 50, "2024-06-15 00:00:00", 0, null, "2024-01-01 00:00:00", null, "Maria", TipoDeEmprestimo.TOMEI_EMPRESTADO],
        ],
      }]);

      const result = await repository.totaisDoMes(moment("2024-06-01").toDate());

      expect(result.aReceber.toNumber()).toBe(100);
      expect(result.aPagar.toNumber()).toBe(50);
      expect(result.parcelasDoMes).toHaveLength(2);

      const [query, params] = (db.exec as jest.Mock).mock.calls[0];
      expect(query).toContain("cancelado IS NULL OR e.cancelado = 0");
      expect(params.$month).toBe("06");
      expect(params.$year).toBe("2024");
    });

    it("retorna totais zerados quando não há parcelas no mês", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([{ columns: ["id"], values: [] }]);

      const result = await repository.totaisDoMes(new Date());

      expect(result.aReceber.toNumber()).toBe(0);
      expect(result.aPagar.toNumber()).toBe(0);
      expect(result.parcelasDoMes).toEqual([]);
    });
  });
});
