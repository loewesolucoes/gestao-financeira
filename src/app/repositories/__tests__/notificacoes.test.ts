import moment from "moment";
import { TableNames } from "../default";
import { IDatabase } from "../database-connector";
import { NotificacoesRepository, TipoDeNotificacao } from "../notificacoes";
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

describe("NotificacoesRepository", () => {
  let db: jest.Mocked<IDatabase>;
  let repository: NotificacoesRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    db = createDbMock();
    repository = new NotificacoesRepository(db);
  });

  describe("listByTipo", () => {
    it("busca e mapeia os itens de um tipo, mais recentes primeiro", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([
        {
          columns: ["id", "tipo", "titulo", "descricao", "lida", "data", "createdDate"],
          values: [[1, 0, "Erro", "Falhou", 0, "2024-06-01 10:00:00", "2024-06-01 10:00:00"]],
        },
      ]);

      const result = await repository.listByTipo(TipoDeNotificacao.NOTIFICACAO);

      expect(db.exec).toHaveBeenCalledWith(
        `select * from ${TableNames.NOTIFICACOES} where tipo = $tipo order by data desc`,
        { "$tipo": TipoDeNotificacao.NOTIFICACAO }
      );

      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe("Erro");
      expect(result[0].tipo).toBe(0);
      expect(result[0].lida).toBe(false);
      expect(result[0].data).toBeInstanceOf(Date);
    });
  });

  describe("countUnread", () => {
    it("retorna a contagem de não lidas para o tipo informado", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([{ columns: ["total"], values: [[3]] }]);

      const result = await repository.countUnread(TipoDeNotificacao.MENSAGEM);

      expect(db.exec).toHaveBeenCalledWith(
        `select count(*) as total from ${TableNames.NOTIFICACOES} where tipo = $tipo and lida = 0`,
        { "$tipo": TipoDeNotificacao.MENSAGEM }
      );
      expect(result).toBe(3);
    });

    it("retorna 0 quando não há resultado", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      const result = await repository.countUnread(TipoDeNotificacao.MENSAGEM);

      expect(result).toBe(0);
    });
  });

  describe("marcarComoLida", () => {
    it("atualiza lida=true via save/update e persiste", async () => {
      (db.exec as jest.Mock)
        .mockResolvedValueOnce([]) // UPDATE
        .mockResolvedValueOnce([{ columns: ["id", "lida"], values: [[5, 1]] }]); // get() follow-up

      await repository.marcarComoLida(5);

      const [updateCommand, updateParams] = (db.exec as jest.Mock).mock.calls[0];
      expect(updateCommand).toContain(`UPDATE ${TableNames.NOTIFICACOES} SET`);
      expect(updateParams.$lida).toBe(true);
      expect(updateParams.$id).toBe(5);

      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });
  });

  describe("marcarTodasComoLidas", () => {
    it("marca todas as não lidas de um tipo como lidas e persiste", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      await repository.marcarTodasComoLidas(TipoDeNotificacao.NOTIFICACAO);

      const [command, params] = (db.exec as jest.Mock).mock.calls[0];
      expect(command).toBe(`update ${TableNames.NOTIFICACOES} set lida = 1, updatedDate = $updatedDate where tipo = $tipo and lida = 0`);
      expect(params.$tipo).toBe(TipoDeNotificacao.NOTIFICACAO);
      expect(params.$updatedDate).toBeDefined();

      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });
  });

  describe("limparLidas", () => {
    it("sem diasRetencao: apaga todas as lidas, sem filtro de data", async () => {
      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      await repository.limparLidas();

      expect(db.exec).toHaveBeenCalledWith(`delete from ${TableNames.NOTIFICACOES} where lida = 1`);
      expect(db.export).toHaveBeenCalledTimes(1);
      expect(RepositoryUtil.persistLocalDump).toHaveBeenCalledWith("fake-dump");
    });

    it("com diasRetencao: apaga apenas as lidas mais antigas que o limite calculado", async () => {
      jest.useFakeTimers().setSystemTime(new Date(2024, 5, 30, 12, 0, 0));

      (db.exec as jest.Mock).mockResolvedValueOnce([]);

      await repository.limparLidas(30);

      const expectedLimite = moment().subtract(30, 'days').format();

      expect(db.exec).toHaveBeenCalledWith(
        `delete from ${TableNames.NOTIFICACOES} where lida = 1 and updatedDate < $limite`,
        { "$limite": expectedLimite }
      );

      jest.useRealTimers();
    });
  });
});
