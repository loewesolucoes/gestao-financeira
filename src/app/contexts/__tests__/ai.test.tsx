import '@testing-library/jest-dom';
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AiProvider, useAi, DEFAULT_MODEL, FALLBACK_MODELS } from "../ai";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../../repositories/parametros";

const generateTextMock = jest.fn();
const toolMock = jest.fn((config: any) => config);
const stepCountIsMock = jest.fn((...args: any[]) => ({ __stepCountIs: args[0] }));
const createGoogleGenerativeAIMock = jest.fn(() => (modelName: string) => ({ modelName }));

// @ai-sdk/google, ai and zod are dynamically imported (import()) inside ai.tsx so they're only
// fetched when the chat is actually used, not bundled/loaded globally. jest.mock intercepts both
// static and dynamic import resolution, so these mocks work the same way as before.
jest.mock("ai", () => ({
  generateText: (...args: any[]) => generateTextMock(...args),
  tool: (config: any) => toolMock(config),
  stepCountIs: (...args: any[]) => stepCountIsMock(...args),
}));

jest.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: (...args: any[]) => createGoogleGenerativeAIMock(...args),
}));

const fetchMock = jest.fn();

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
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
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

  it("fica pronto e chama generateText com system/tools/messages corretos quando há chave configurada, usando o modelo default", async () => {
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
    expect(callArgs.model).toEqual({ modelName: DEFAULT_MODEL });
    expect(stepCountIsMock).toHaveBeenCalledWith(6);
    expect(callArgs.stopWhen).toEqual({ __stepCountIs: 6 });
    expect(callArgs.tools.consultarBancoDados).toBeDefined();

    await callArgs.tools.consultarBancoDados.execute({ sql: "SELECT * FROM transacoes" });
    expect(mockRunReadOnlyQuery).toHaveBeenCalledWith("SELECT * FROM transacoes");
  });

  it("usa o modelo informado explicitamente ao invés do default", async () => {
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

    await act(() => ai!.askRelatoriosChat([{ role: "user", content: "oi" }], "gemini-3.5-pro"));

    expect(generateTextMock.mock.calls[0][0].model).toEqual({ modelName: "gemini-3.5-pro" });
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

  it("listAvailableModels retorna o fallback quando não há chave de API", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("");

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(screen.getByText("not-ready")).toBeInTheDocument());

    const models = await act(() => ai!.listAvailableModels());

    expect(models).toEqual(FALLBACK_MODELS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("listAvailableModels busca modelos gemini com generateContent na API do Google, mantendo só pro/flash/lite", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { name: "models/gemini-3.5-flash-lite", displayName: "Gemini 3.5 Flash Lite", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-3.5-pro", displayName: "Gemini 3.5 Pro", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-embedding-001", displayName: "Gemini Embedding", supportedGenerationMethods: ["embedContent"] },
          { name: "models/aqa", displayName: "AQA", supportedGenerationMethods: ["generateContent"] },
          { name: "models/gemini-2.5-computer-use", displayName: "Gemini Computer Use", supportedGenerationMethods: ["generateContent"] },
        ],
      }),
    });

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());

    const models = await act(() => ai!.listAvailableModels());

    expect(fetchMock).toHaveBeenCalledWith("https://generativelanguage.googleapis.com/v1beta/models?key=fake-api-key");
    expect(models).toEqual([
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
      { id: "gemini-3.5-pro", label: "Gemini 3.5 Pro" },
    ]);
  });

  it("listAvailableModels retorna o fallback quando a requisição falha", async () => {
    mockIsDbOk = true;
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    fetchMock.mockRejectedValue(new Error("network error"));

    let ai: ReturnType<typeof useAi> | undefined;

    render(
      <AiProvider>
        <TestComponent onReady={(a) => { ai = a; }} />
      </AiProvider>
    );

    await waitFor(() => expect(screen.getByText("ready")).toBeInTheDocument());

    const models = await act(() => ai!.listAvailableModels());

    expect(models).toEqual(FALLBACK_MODELS);
  });
});
