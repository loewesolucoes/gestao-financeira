import '@testing-library/jest-dom';
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AiProvider, useAi } from "../ai";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../../repositories/parametros";

const generateTextMock = jest.fn();
const toolMock = jest.fn((config: any) => config);
const createGoogleGenerativeAIMock = jest.fn(() => (modelName: string) => ({ modelName }));

jest.mock("ai", () => ({
  generateText: (...args: any[]) => generateTextMock(...args),
  tool: (config: any) => toolMock(config),
}));

jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: (...args: any[]) => createGoogleGenerativeAIMock(...args),
}));

let mockIsDbOk = false;
let mockGetValorByKey = jest.fn();
let mockRunReadOnlyQuery = jest.fn();

jest.mock("../storage", () => ({
  useStorage: () => ({
    isDbOk: mockIsDbOk,
    repository: {
      params: { getValorByKey: mockGetValorByKey },
      runReadOnlyQuery: mockRunReadOnlyQuery,
    },
  }),
}));

function TestComponent({ onReady }: { onReady: (ai: ReturnType<typeof useAi>) => void }) {
  const ai = useAi();

  onReady(ai);

  return <div>{ai.isReady ? "ready" : "not-ready"}</div>;
}

describe("AiProvider / useAi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbOk = false;
    mockGetValorByKey = jest.fn();
    mockRunReadOnlyQuery = jest.fn();
    delete (window as any).__google;
  });

  it("não fica pronto e não chama o modelo quando não há chave de API configurada", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("");

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(mockGetValorByKey).toHaveBeenCalledWith(GOOGLE_GENERATIVE_AI_API_KEY));
    await waitFor(() => expect(screen.getByText("not-ready")).toBeInTheDocument());

    const result = await act(() => ai!.askRelatoriosChat([{ role: "user", content: "oi" }]));

    expect(result).toBeUndefined();
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("fica pronto e chama generateText com system/tools/messages corretos quando há chave configurada", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    generateTextMock.mockResolvedValue({ text: "resposta do modelo" });

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());

    const messages = [{ role: "user" as const, content: "quanto gastei em julho?" }];
    const result = await act(() => ai!.askRelatoriosChat(messages));

    expect(result).toBe("resposta do modelo");
    expect(createGoogleGenerativeAIMock).toHaveBeenCalledWith({ apiKey: "fake-api-key" });

    const callArgs = generateTextMock.mock.calls[0][0];

    expect(callArgs.system).toBe("MOCKED_MARKDOWN_CONTENT");
    expect(callArgs.messages).toBe(messages);
    expect(callArgs.maxSteps).toBe(6);
    expect(callArgs.tools.consultarBancoDados).toBeDefined();

    await callArgs.tools.consultarBancoDados.execute({ sql: "SELECT * FROM transacoes" });
    expect(mockRunReadOnlyQuery).toHaveBeenCalledWith("SELECT * FROM transacoes");
  });

  it("roteia erros do modelo (chave inválida, cota, rede) para o NotificationUtil sem lançar exceção", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    generateTextMock.mockRejectedValue(new Error("quota exceeded"));

    const notificationSendSpy = jest.spyOn(require("../../utils/notification").NotificationUtil, "send");

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());

    const result = await act(() => ai!.askRelatoriosChat([{ role: "user", content: "oi" }]));

    expect(result).toBeUndefined();
    expect(notificationSendSpy).toHaveBeenCalled();
  });
});
