import { NotificationUtil } from "../notification";
import { TipoDeNotificacao } from "../../repositories/notificacoes";

describe("NotificationUtil", () => {
  let postMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    postMessageSpy = jest.spyOn(NotificationUtil.broadcast, "postMessage").mockImplementation(() => { });
  });

  afterEach(() => {
    postMessageSpy.mockRestore();
  });

  describe("send", () => {
    it("envia o payload com tipo NOTIFICACAO (sino)", () => {
      NotificationUtil.send("Dados salvos no Google Drive");

      expect(postMessageSpy).toHaveBeenCalledWith({
        message: "Dados salvos no Google Drive",
        titulo: undefined,
        tipo: TipoDeNotificacao.NOTIFICACAO,
      });
    });

    it("aceita um título opcional", () => {
      NotificationUtil.send("Não foi possível salvar.", "Falha ao salvar no Google Drive");

      expect(postMessageSpy).toHaveBeenCalledWith({
        message: "Não foi possível salvar.",
        titulo: "Falha ao salvar no Google Drive",
        tipo: TipoDeNotificacao.NOTIFICACAO,
      });
    });
  });

  describe("sendMensagem", () => {
    it("envia o payload com tipo MENSAGEM (envelope)", () => {
      NotificationUtil.sendMensagem("Novidades da versão", "Confira as novidades.");

      expect(postMessageSpy).toHaveBeenCalledWith({
        message: "Confira as novidades.",
        titulo: "Novidades da versão",
        tipo: TipoDeNotificacao.MENSAGEM,
      });
    });
  });
});
