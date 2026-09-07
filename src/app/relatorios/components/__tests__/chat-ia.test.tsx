import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ChatIa } from "../chat-ia";

let mockIsDbOk = true;
let mockGetValorByKey = jest.fn();
let mockAskRelatoriosChat = jest.fn();
let mockListAvailableModels = jest.fn();

// Kept in sync with the FALLBACK_MODELS literal inlined in the jest.mock factory below (can't
// reference an outer const from inside it — jest.mock factories are hoisted above regular
// declarations, so the array must be a literal there and this is a plain duplicate for
// assertions in the test bodies, which run after module init).
const fallbackModels = [
  { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
  { id: "gemini-3.5-pro", label: "Gemini 3.5 Pro" },
];

jest.mock("../../../contexts/storage", () => ({
  useStorage: () => ({
    isDbOk: mockIsDbOk,
    repository: {
      params: { getValorByKey: mockGetValorByKey },
    },
  }),
}));

jest.mock("../../../contexts/ai", () => ({
  useAi: () => ({
    askRelatoriosChat: mockAskRelatoriosChat,
    listAvailableModels: mockListAvailableModels,
  }),
  DEFAULT_MODEL: "gemini-3.5-flash-lite",
  FALLBACK_MODELS: [
    { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
    { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { id: "gemini-3.5-pro", label: "Gemini 3.5 Pro" },
  ],
}));

// The real Input(type="mdtextarea") mounts EasyMDE/CodeMirror, which isn't meaningful
// to exercise in jsdom. ChatIa only relies on Input's onChange(value)/value contract,
// so stand in with a plain textarea that honors that same contract.
jest.mock("../../../components/input", () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <textarea {...props} value={value ?? ""} onChange={(e: any) => onChange(e.target.value)} />
  ),
}));

// `marked`/`dompurify` aren't transformable in this project's Jest setup (ESM-only
// build), so use a tiny stand-in that covers the markdown constructs exercised below.
jest.mock("../../../utils/markdown", () => ({
  MarkdownUtils: {
    render: (text: string) => {
      if (!text) return "";

      return text
        .split("\n\n")
        .map(block => {
          if (block.startsWith("- ")) {
            const items = block.split("\n").map(line => `<li>${line.replace(/^- /, "")}</li>`).join("");
            return `<ul>${items}</ul>`;
          }
          return `<p>${block.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>`;
        })
        .join("");
    },
  },
}));

describe("ChatIa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbOk = true;
    mockGetValorByKey = jest.fn();
    mockAskRelatoriosChat = jest.fn();
    mockListAvailableModels = jest.fn().mockResolvedValue(fallbackModels);
  });

  it("mostra o aviso para configurar a chave quando ela não está definida", async () => {
    mockGetValorByKey.mockResolvedValue("");

    render(<ChatIa />);

    await waitFor(() => expect(screen.getByText(/configure sua chave/i)).toBeInTheDocument());
    expect(screen.queryByPlaceholderText(/Escreva sua pergunta/i)).not.toBeInTheDocument();
  });

  it("permite enviar uma pergunta e renderiza a resposta do assistente", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    mockAskRelatoriosChat.mockResolvedValue("Você gastou R$ 100,00 em julho.");

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Quanto gastei em julho?" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText("Quanto gastei em julho?")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Você gastou R$ 100,00 em julho.")).toBeInTheDocument());
    expect(mockAskRelatoriosChat).toHaveBeenCalledWith([{ role: "user", content: "Quanto gastei em julho?" }], "gemini-3.5-flash-lite");
  });

  it("renderiza a resposta do assistente como markdown", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    mockAskRelatoriosChat.mockResolvedValue("**Maior gasto:** Mercado\n\n- Item 1\n- Item 2");

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Quais foram os maiores gastos?" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(screen.getByText("Maior gasto:")).toBeInTheDocument());

    expect(screen.getByText("Maior gasto:").tagName).toBe("STRONG");
    expect(screen.getByText("Item 1").closest("li")).toBeInTheDocument();
  });

  it("mostra o loader enquanto aguarda a resposta", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");

    let resolvePromise: (value: string) => void = () => { };
    mockAskRelatoriosChat.mockReturnValue(new Promise(resolve => { resolvePromise = resolve; }));

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByTestId("app-loader")).toBeInTheDocument();

    resolvePromise("Resposta");
    await waitFor(() => expect(screen.queryByTestId("app-loader")).not.toBeInTheDocument());
  });

  it("limpa a conversa ao clicar em 'Limpar conversa'", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    mockAskRelatoriosChat.mockResolvedValue("Resposta");

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(screen.getByText("Resposta")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /limpar conversa/i }));

    expect(screen.queryByText("Oi")).not.toBeInTheDocument();
    expect(screen.queryByText("Resposta")).not.toBeInTheDocument();
  });

  it("carrega e permite trocar o modelo selecionado, usando-o ao enviar a pergunta", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    mockAskRelatoriosChat.mockResolvedValue("Resposta");

    render(<ChatIa />);

    await screen.findByPlaceholderText(/Escreva sua pergunta/i);
    await waitFor(() => expect(mockListAvailableModels).toHaveBeenCalled());

    const select = screen.getByLabelText(/modelo/i) as HTMLSelectElement;

    expect(select.value).toBe("gemini-3.5-flash-lite");
    fallbackModels.forEach(model => {
      expect(screen.getByRole("option", { name: model.label })).toBeInTheDocument();
    });

    fireEvent.change(select, { target: { value: "gemini-3.5-pro" } });

    const textarea = screen.getByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(mockAskRelatoriosChat).toHaveBeenCalledWith([{ role: "user", content: "Oi" }], "gemini-3.5-pro"));
  });

  it("mostra perguntas de exemplo que apenas preenchem o campo de texto ao clicar", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");

    render(<ChatIa />);

    const exampleButton = await screen.findByRole("button", { name: /quanto gastei este mês\?/i });

    fireEvent.click(exampleButton);

    const textarea = screen.getByPlaceholderText(/Escreva sua pergunta/i) as HTMLTextAreaElement;

    expect(textarea.value).toBe("Quanto gastei este mês?");
    expect(mockAskRelatoriosChat).not.toHaveBeenCalled();
  });

  it("alterna mensagens de loading enquanto aguarda a resposta", async () => {
    jest.useFakeTimers();

    mockGetValorByKey.mockResolvedValue("fake-api-key");

    let resolvePromise: (value: string) => void = () => { };
    mockAskRelatoriosChat.mockReturnValue(new Promise(resolve => { resolvePromise = resolve; }));

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Escreva sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    const firstMessage = screen.getByText(/Consultando suas transações\.\.\./i);

    expect(firstMessage).toBeInTheDocument();

    await act(async () => { jest.advanceTimersByTime(2000); });

    expect(screen.queryByText(/Consultando suas transações\.\.\./i)).not.toBeInTheDocument();

    resolvePromise("Resposta");
    await act(async () => { jest.runOnlyPendingTimers(); });

    jest.useRealTimers();
  });
});
