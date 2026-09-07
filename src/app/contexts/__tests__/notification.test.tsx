import '@testing-library/jest-dom';
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { NotificationProvider, useNotification } from "../notification";
import { TipoDeNotificacao } from "../../repositories/notificacoes";

let mockIsDbOk = false;
let mockSave = jest.fn();
let mockCountUnread = jest.fn();
let mockLimparLidas = jest.fn();
let mockListByTipo = jest.fn();
let mockMarcarComoLida = jest.fn();
let mockMarcarTodasComoLidas = jest.fn();

jest.mock("../storage", () => ({
  useStorage: () => ({
    isDbOk: mockIsDbOk,
    repository: {
      notificacoes: {
        save: mockSave,
        countUnread: mockCountUnread,
        limparLidas: mockLimparLidas,
        listByTipo: mockListByTipo,
        marcarComoLida: mockMarcarComoLida,
        marcarTodasComoLidas: mockMarcarTodasComoLidas,
      },
    },
  }),
}));

// jest.setup.ts installs a no-op BroadcastChannel mock (postMessage does nothing) so importing
// NotificationUtil doesn't hang the test process. To exercise NotificationProvider's own message
// handling we swap in a capturing fake that records the instance the provider creates in its
// effect, so we can trigger `onmessage` manually with a synthetic payload instead of depending on
// real cross-instance BroadcastChannel delivery (which the no-op mock intentionally disables).
class CapturingBroadcastChannel {
  static instances: CapturingBroadcastChannel[] = [];
  name: string;
  onmessage: ((event: { data: any }) => void) | null = null;

  constructor(name: string) {
    this.name = name;
    CapturingBroadcastChannel.instances.push(this);
  }

  postMessage(): void { }
  close(): void { }
}

function lastChannel(): CapturingBroadcastChannel {
  const instance = CapturingBroadcastChannel.instances[CapturingBroadcastChannel.instances.length - 1];
  if (!instance) throw new Error("nenhum BroadcastChannel foi criado pelo NotificationProvider");
  return instance;
}

function emitBroadcast(payload: any) {
  act(() => {
    lastChannel().onmessage?.({ data: payload });
  });
}

function TestComponent({ onReady }: { onReady: (value: ReturnType<typeof useNotification>) => void }) {
  const notification = useNotification();

  onReady(notification);

  return (
    <div>
      <span data-testid="naoLidasNotificacoes">{notification.naoLidasNotificacoes}</span>
      <span data-testid="naoLidasMensagens">{notification.naoLidasMensagens}</span>
      <span data-testid="notificationsCount">{notification.notifications.length}</span>
      <span data-testid="itensCount">{notification.itens.length}</span>
      <span data-testid="isLoadingItens">{notification.isLoadingItens ? "true" : "false"}</span>
    </div>
  );
}

describe("NotificationProvider / useNotification", () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbOk = false;
    mockSave = jest.fn(async () => ({}));
    mockCountUnread = jest.fn(async (tipo: TipoDeNotificacao) => (tipo === TipoDeNotificacao.NOTIFICACAO ? 2 : 1));
    mockLimparLidas = jest.fn(async () => { });
    mockListByTipo = jest.fn(async () => []);
    mockMarcarComoLida = jest.fn(async () => { });
    mockMarcarTodasComoLidas = jest.fn(async () => { });

    CapturingBroadcastChannel.instances = [];
    // @ts-expect-error - substitui o mock no-op por um fake que permite disparar onmessage manualmente
    globalThis.BroadcastChannel = CapturingBroadcastChannel;
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("não carrega contadores enquanto o banco não está pronto", async () => {
    render(<NotificationProvider><TestComponent onReady={() => { }} /></NotificationProvider>);

    expect(mockLimparLidas).not.toHaveBeenCalled();
    expect(mockCountUnread).not.toHaveBeenCalled();
    expect(screen.getByTestId("naoLidasNotificacoes")).toHaveTextContent("0");
  });

  it("ao ficar pronto (start ou refresh), limpa lidas antigas e recarrega os contadores", async () => {
    mockIsDbOk = true;

    render(<NotificationProvider><TestComponent onReady={() => { }} /></NotificationProvider>);

    await waitFor(() => expect(mockLimparLidas).toHaveBeenCalledWith(30));
    await waitFor(() => expect(mockCountUnread).toHaveBeenCalledWith(TipoDeNotificacao.NOTIFICACAO));
    await waitFor(() => expect(mockCountUnread).toHaveBeenCalledWith(TipoDeNotificacao.MENSAGEM));

    await waitFor(() => expect(screen.getByTestId("naoLidasNotificacoes")).toHaveTextContent("2"));
    expect(screen.getByTestId("naoLidasMensagens")).toHaveTextContent("1");
  });

  it("persiste toda notificação recebida via broadcast como Notificacao (tipo padrão)", async () => {
    mockIsDbOk = true;

    render(<NotificationProvider><TestComponent onReady={() => { }} /></NotificationProvider>);

    await waitFor(() => expect(mockCountUnread).toHaveBeenCalled());
    mockSave.mockClear();

    emitBroadcast({ message: "Dados salvos no Google Drive", tipo: TipoDeNotificacao.NOTIFICACAO });

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    const [, payload] = mockSave.mock.calls[0];
    expect(payload).toMatchObject({
      tipo: TipoDeNotificacao.NOTIFICACAO,
      descricao: "Dados salvos no Google Drive",
      lida: false,
    });

    await waitFor(() => expect(screen.getByTestId("notificationsCount")).toHaveTextContent("1"));
  });

  it("persiste mensagens do tipo Mensagem (envelope) recebidas via broadcast", async () => {
    mockIsDbOk = true;

    render(<NotificationProvider><TestComponent onReady={() => { }} /></NotificationProvider>);

    await waitFor(() => expect(mockCountUnread).toHaveBeenCalled());
    mockSave.mockClear();

    emitBroadcast({ message: "Confira as novidades.", titulo: "Novidades da versão", tipo: TipoDeNotificacao.MENSAGEM });

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    const [, payload] = mockSave.mock.calls[0];
    expect(payload).toMatchObject({
      tipo: TipoDeNotificacao.MENSAGEM,
      titulo: "Novidades da versão",
      descricao: "Confira as novidades.",
      lida: false,
    });
  });

  it("não tenta persistir quando o banco ainda não está pronto ao receber uma notificação", async () => {
    mockIsDbOk = false;

    render(<NotificationProvider><TestComponent onReady={() => { }} /></NotificationProvider>);

    emitBroadcast({ message: "Chegou antes do banco estar pronto", tipo: TipoDeNotificacao.NOTIFICACAO });

    await waitFor(() => expect(screen.getByTestId("notificationsCount")).toHaveTextContent("1"));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("expõe refreshContadores para outras telas recarregarem os contadores sob demanda", async () => {
    mockIsDbOk = true;
    let notificationValue: ReturnType<typeof useNotification> | undefined;

    render(<NotificationProvider><TestComponent onReady={(value) => { notificationValue = value; }} /></NotificationProvider>);

    await waitFor(() => expect(mockCountUnread).toHaveBeenCalled());
    mockCountUnread.mockClear();
    mockCountUnread.mockImplementation(async (tipo: TipoDeNotificacao) => (tipo === TipoDeNotificacao.NOTIFICACAO ? 5 : 0));

    await act(async () => {
      await notificationValue!.refreshContadores();
    });

    await waitFor(() => expect(screen.getByTestId("naoLidasNotificacoes")).toHaveTextContent("5"));
    expect(screen.getByTestId("naoLidasMensagens")).toHaveTextContent("0");
  });

  it("carregarNotificacoes carrega itens do repositório e compartilha o mesmo estado", async () => {
    mockIsDbOk = true;
    mockListByTipo.mockResolvedValue([{ id: 1, lida: false }, { id: 2, lida: true }]);
    let notificationValue: ReturnType<typeof useNotification> | undefined;

    render(<NotificationProvider><TestComponent onReady={(value) => { notificationValue = value; }} /></NotificationProvider>);

    await act(async () => {
      await notificationValue!.carregarNotificacoes(TipoDeNotificacao.NOTIFICACAO);
    });

    expect(mockListByTipo).toHaveBeenCalledWith(TipoDeNotificacao.NOTIFICACAO);
    await waitFor(() => expect(screen.getByTestId("itensCount")).toHaveTextContent("2"));
    expect(notificationValue!.itens).toHaveLength(2);
  });

  it("marcarComoLida delega ao repositório, recarrega itens e atualiza os contadores", async () => {
    mockIsDbOk = true;
    mockListByTipo.mockResolvedValue([{ id: 1, lida: true }]);
    let notificationValue: ReturnType<typeof useNotification> | undefined;

    render(<NotificationProvider><TestComponent onReady={(value) => { notificationValue = value; }} /></NotificationProvider>);

    await act(async () => {
      await notificationValue!.carregarNotificacoes(TipoDeNotificacao.NOTIFICACAO);
    });

    mockCountUnread.mockClear();

    await act(async () => {
      await notificationValue!.marcarComoLida(1);
    });

    expect(mockMarcarComoLida).toHaveBeenCalledWith(1);
    expect(mockListByTipo).toHaveBeenCalledWith(TipoDeNotificacao.NOTIFICACAO);
    expect(mockCountUnread).toHaveBeenCalled();
  });

  it("marcarTodasComoLidas delega ao repositório com o tipo informado, recarrega itens e contadores", async () => {
    mockIsDbOk = true;
    let notificationValue: ReturnType<typeof useNotification> | undefined;

    render(<NotificationProvider><TestComponent onReady={(value) => { notificationValue = value; }} /></NotificationProvider>);

    await act(async () => {
      await notificationValue!.carregarNotificacoes(TipoDeNotificacao.MENSAGEM);
    });

    mockListByTipo.mockClear();
    mockCountUnread.mockClear();

    await act(async () => {
      await notificationValue!.marcarTodasComoLidas(TipoDeNotificacao.MENSAGEM);
    });

    expect(mockMarcarTodasComoLidas).toHaveBeenCalledWith(TipoDeNotificacao.MENSAGEM);
    expect(mockListByTipo).toHaveBeenCalledWith(TipoDeNotificacao.MENSAGEM);
    expect(mockCountUnread).toHaveBeenCalled();
  });

  it("limparLidas delega ao repositório, recarrega itens e contadores", async () => {
    mockIsDbOk = true;
    let notificationValue: ReturnType<typeof useNotification> | undefined;

    render(<NotificationProvider><TestComponent onReady={(value) => { notificationValue = value; }} /></NotificationProvider>);

    await act(async () => {
      await notificationValue!.carregarNotificacoes(TipoDeNotificacao.NOTIFICACAO);
    });

    mockListByTipo.mockClear();
    mockCountUnread.mockClear();

    await act(async () => {
      await notificationValue!.limparLidas();
    });

    expect(mockLimparLidas).toHaveBeenCalledWith(undefined);
    expect(mockListByTipo).toHaveBeenCalledWith(TipoDeNotificacao.NOTIFICACAO);
    expect(mockCountUnread).toHaveBeenCalled();
  });
});
