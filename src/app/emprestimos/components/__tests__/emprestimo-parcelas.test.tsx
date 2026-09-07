import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { EmprestimoParcelasList } from "../emprestimo-parcelas";
import { EmprestimoParcelas } from "@/app/repositories/emprestimos";
import BigNumber from "bignumber.js";

const marcarParcelaPaga = jest.fn(async () => ({}));
const editarParcela = jest.fn(async (_id: number, _data: any) => ({}));
const refresh = jest.fn(async () => { });

jest.mock("../../../contexts/storage", () => ({
  useStorage: () => ({
    repository: {
      emprestimos: {
        marcarParcelaPaga,
        editarParcela,
      },
    },
    refresh,
  }),
}));

// `marked` isn't transformable in this project's Jest setup (ESM-only build)
// — see relatorios/components/__tests__/chat-ia.test.tsx.
jest.mock("../../../utils/markdown", () => ({
  MarkdownUtils: {
    render: (text: string) => text || "",
  },
}));

// The real MDTextArea mounts EasyMDE/CodeMirror, which crashes under jsdom
// once given non-empty initial text (CodeMirror's bidi detection needs a real
// Range.getBoundingClientRect). Stand in with a plain textarea honoring the
// same onChangeInput/inputValue contract — same workaround as chat-ia.test.tsx.
jest.mock("../../../components/md-text-area", () => ({
  MDTextArea: ({ onChangeInput, inputValue, otherProps }: any) => (
    <textarea onChange={onChangeInput} value={inputValue ?? ""} {...otherProps} />
  ),
}));

describe("EmprestimoParcelasList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function buildParcelas(): EmprestimoParcelas[] {
    return [
      { id: 1, emprestimoId: 10, numero: 1, valor: BigNumber(100), dataVencimento: new Date(2024, 0, 1), pago: false } as any,
      { id: 2, emprestimoId: 10, numero: 2, valor: BigNumber(100), dataVencimento: new Date(2024, 1, 1), pago: true } as any,
    ];
  }

  it("renderiza o estado vazio quando não há parcelas", () => {
    render(<EmprestimoParcelasList parcelas={[]} />);

    expect(screen.getByText(/Nenhuma parcela cadastrada/i)).toBeInTheDocument();
  });

  it("renderiza uma linha por parcela ordenada por número", () => {
    render(<EmprestimoParcelasList parcelas={buildParcelas()} />);

    expect(screen.getByText("Parcela 1")).toBeInTheDocument();
    expect(screen.getByText("Parcela 2")).toBeInTheDocument();
  });

  it("chama marcarParcelaPaga ao marcar/desmarcar o checkbox", async () => {
    render(<EmprestimoParcelasList parcelas={buildParcelas()} />);

    const checkbox = screen.getByLabelText("Parcela 1") as HTMLInputElement;
    fireEvent.click(checkbox);

    await waitFor(() => expect(marcarParcelaPaga).toHaveBeenCalledWith(1, true));
    expect(refresh).toHaveBeenCalled();
  });

  it("chama editarParcela ao salvar edição de valor/dataVencimento", async () => {
    render(<EmprestimoParcelasList parcelas={buildParcelas()} />);

    fireEvent.click(screen.getAllByText("Editar")[0]);

    const valorInput = screen.getByLabelText(/Valor da parcela 1/i);
    fireEvent.change(valorInput, { target: { value: "150" } });

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(editarParcela).toHaveBeenCalled());
    const [parcelaId, data] = editarParcela.mock.calls[0];
    expect(parcelaId).toBe(1);
    expect(data.valor.toNumber()).toBe(150);
  });

  it("exibe o campo de comentário ao editar uma parcela e mantém o valor atual ao salvar", async () => {
    const parcelas = buildParcelas();
    parcelas[0].comentario = "pago com atraso";

    render(<EmprestimoParcelasList parcelas={parcelas} />);

    fireEvent.click(screen.getAllByText("Editar")[0]);

    expect(screen.getByPlaceholderText(/Comentário/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Salvar"));

    await waitFor(() => expect(editarParcela).toHaveBeenCalled());
    const [, data] = editarParcela.mock.calls[0];
    expect(data.comentario).toBe("pago com atraso");
  });

  it("exibe o comentário renderizado na linha da parcela quando presente", () => {
    const parcelas = buildParcelas();
    parcelas[0].comentario = "nota da parcela";

    render(<EmprestimoParcelasList parcelas={parcelas} />);

    expect(screen.getByText("nota da parcela")).toBeInTheDocument();
  });

  it("não exibe nenhum comentário quando a parcela não tem um", () => {
    render(<EmprestimoParcelasList parcelas={buildParcelas()} />);

    expect(screen.queryByText(/nota da parcela/i)).not.toBeInTheDocument();
  });
});
