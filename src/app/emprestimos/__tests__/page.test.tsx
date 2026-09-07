import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "../page";
import { StatusEmprestimo, TipoDeEmprestimo } from "@/app/repositories/emprestimos";
import BigNumber from "bignumber.js";

// Layout pulls in AppProviders/contexts unrelated to the page content itself,
// so it's mocked as a passthrough here (same pattern as faq/__tests__/page.test.tsx).
jest.mock("../../shared/layout", () => ({
  Layout: ({ children }: any) => <>{children}</>,
}));

// `marked`/`dompurify` aren't transformable in this project's Jest setup
// (ESM-only build) — see relatorios/components/__tests__/chat-ia.test.tsx.
jest.mock("../../utils/markdown", () => ({
  MarkdownUtils: {
    render: (text: string) => text || "",
  },
}));

function buildEmprestimo(parcela1Pago: boolean) {
  return {
    id: 1,
    tipo: TipoDeEmprestimo.EMPRESTEI,
    pessoa: "João",
    valorTotal: BigNumber(200),
    numeroParcelas: 2,
    dataInicio: new Date(2024, 0, 1),
    comentario: "",
    status: StatusEmprestimo.ATIVO,
    parcelas: [
      { id: 1, emprestimoId: 1, numero: 1, valor: BigNumber(100), dataVencimento: new Date(2024, 0, 1), pago: parcela1Pago },
      { id: 2, emprestimoId: 1, numero: 2, valor: BigNumber(100), dataVencimento: new Date(2024, 1, 1), pago: false },
    ],
  } as any;
}

const listComParcelas = jest.fn();
const marcarParcelaPaga = jest.fn(async () => ({}));
const refresh = jest.fn(async () => { });

jest.mock("../../contexts/storage", () => ({
  useStorage: () => ({
    isDbOk: true,
    repository: {
      save: jest.fn(async () => ({ id: 1 })),
      emprestimos: {
        listComParcelas,
        criarComParcelas: jest.fn(async () => ({ id: 1 })),
        cancelar: jest.fn(async () => ({ id: 1, cancelado: true })),
        excluir: jest.fn(async () => { }),
        marcarParcelaPaga,
      },
    },
    refresh,
  }),
}));

describe("Emprestimos Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reflete o novo estado da parcela na modal aberta após marcá-la como paga, sem precisar recarregar a página", async () => {
    listComParcelas
      .mockResolvedValueOnce([buildEmprestimo(false)]) // carga inicial
      .mockResolvedValueOnce([buildEmprestimo(true)]); // recarga após marcar a parcela 1 como paga

    render(<Page />);

    await waitFor(() => expect(screen.getByText("João")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Editar"));

    const checkbox = (await screen.findByLabelText("Parcela 1")) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    await waitFor(() => expect(marcarParcelaPaga).toHaveBeenCalledWith(1, true));
    await waitFor(() => expect(listComParcelas).toHaveBeenCalledTimes(2));

    await waitFor(() => expect((screen.getByLabelText("Parcela 1") as HTMLInputElement).checked).toBe(true));
  });
});
