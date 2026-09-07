import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatIa } from "../chat-ia";

let mockIsDbOk = true;
let mockGetValorByKey = jest.fn();
let mockAskRelatoriosChat = jest.fn();

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
  }),
}));

describe("ChatIa", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDbOk = true;
    mockGetValorByKey = jest.fn();
    mockAskRelatoriosChat = jest.fn();
  });

  it("mostra o aviso para configurar a chave quando ela não está definida", async () => {
    mockGetValorByKey.mockResolvedValue("");

    render(<ChatIa />);

    await waitFor(() => expect(screen.getByText(/configure sua chave/i)).toBeInTheDocument());
    expect(screen.queryByPlaceholderText(/Digite sua pergunta/i)).not.toBeInTheDocument();
  });

  it("permite enviar uma pergunta e renderiza a resposta do assistente", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");
    mockAskRelatoriosChat.mockResolvedValue("Você gastou R$ 100,00 em julho.");

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Digite sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Quanto gastei em julho?" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText("Quanto gastei em julho?")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText("Você gastou R$ 100,00 em julho.")).toBeInTheDocument());
    expect(mockAskRelatoriosChat).toHaveBeenCalledWith([{ role: "user", content: "Quanto gastei em julho?" }]);
  });

  it("mostra o loader enquanto aguarda a resposta", async () => {
    mockGetValorByKey.mockResolvedValue("fake-api-key");

    let resolvePromise: (value: string) => void = () => { };
    mockAskRelatoriosChat.mockReturnValue(new Promise(resolve => { resolvePromise = resolve; }));

    render(<ChatIa />);

    const textarea = await screen.findByPlaceholderText(/Digite sua pergunta/i);

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

    const textarea = await screen.findByPlaceholderText(/Digite sua pergunta/i);

    fireEvent.change(textarea, { target: { value: "Oi" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar/i }));

    await waitFor(() => expect(screen.getByText("Resposta")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /limpar conversa/i }));

    expect(screen.queryByText("Oi")).not.toBeInTheDocument();
    expect(screen.queryByText("Resposta")).not.toBeInTheDocument();
  });
});
