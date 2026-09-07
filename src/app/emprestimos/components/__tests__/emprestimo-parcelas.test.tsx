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
});
