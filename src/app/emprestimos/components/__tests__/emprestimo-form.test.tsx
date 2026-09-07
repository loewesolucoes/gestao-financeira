import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { EmprestimoForm } from "../emprestimo-form";
import { StatusEmprestimo, TipoDeEmprestimo } from "@/app/repositories/emprestimos";
import BigNumber from "bignumber.js";

const save = jest.fn(async () => ({ id: 1 }));
const criarComParcelas = jest.fn(async () => ({ id: 1 }));
const cancelar = jest.fn(async () => ({ id: 1, cancelado: true }));
const excluir = jest.fn(async () => { });
const refresh = jest.fn(async () => { });

jest.mock("../../../contexts/storage", () => ({
  useStorage: () => ({
    isDbOk: true,
    repository: {
      save,
      emprestimos: {
        criarComParcelas,
        cancelar,
        excluir,
      },
    },
    refresh,
  }),
}));

describe("EmprestimoForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renderiza campos básicos", () => {
    render(<EmprestimoForm />);

    expect(screen.getByLabelText(/^Tipo$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pessoa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor total/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de parcelas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de início/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Comentário/i)).toBeInTheDocument();
  });

  it("chama onCustomSubmit com os dados preenchidos ao submeter (modo criação)", async () => {
    const onCustomSubmit = jest.fn();
    const { container } = render(<EmprestimoForm onCustomSubmit={onCustomSubmit} />);

    fireEvent.change(screen.getByLabelText(/Pessoa/i), { target: { value: "João" } });
    fireEvent.change(screen.getByLabelText(/Valor total/i), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText(/Número de parcelas/i), { target: { value: "3" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onCustomSubmit).toHaveBeenCalled());

    const submittedData = onCustomSubmit.mock.calls[0][0];
    expect(submittedData.pessoa).toBe("João");
    expect(submittedData.numeroParcelas).toBe(3);
  });

  it("salva apenas os campos reais da tabela ao editar (sem parcelas/status)", async () => {
    const emprestimo = {
      id: 1,
      tipo: TipoDeEmprestimo.EMPRESTEI,
      pessoa: "João",
      valorTotal: BigNumber(300),
      numeroParcelas: 3,
      dataInicio: new Date(),
      status: StatusEmprestimo.ATIVO,
      parcelas: [{ id: 1, numero: 1 }],
    } as any;

    const { container } = render(<EmprestimoForm emprestimo={emprestimo} />);

    fireEvent.change(screen.getByLabelText(/Pessoa/i), { target: { value: "João Atualizado" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(save).toHaveBeenCalled());

    const [, submittedData] = save.mock.calls[0];
    expect(submittedData.id).toBe(1);
    expect(submittedData.pessoa).toBe("João Atualizado");
    expect(submittedData.parcelas).toBeUndefined();
    expect(submittedData.status).toBeUndefined();
  });

  it("exclui o empréstimo definitivamente ao confirmar", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
    const onClose = jest.fn();

    const emprestimo = {
      id: 1,
      tipo: TipoDeEmprestimo.EMPRESTEI,
      pessoa: "João",
      status: StatusEmprestimo.ATIVO,
      dataInicio: new Date(),
      parcelas: [],
    } as any;

    render(<EmprestimoForm emprestimo={emprestimo} onClose={onClose} />);

    fireEvent.click(screen.getByText(/Excluir para sempre/i));

    await waitFor(() => expect(excluir).toHaveBeenCalledWith(1));
    expect(refresh).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("não exclui o empréstimo quando a confirmação é cancelada", async () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

    const emprestimo = {
      id: 1,
      tipo: TipoDeEmprestimo.EMPRESTEI,
      pessoa: "João",
      status: StatusEmprestimo.ATIVO,
      dataInicio: new Date(),
      parcelas: [],
    } as any;

    render(<EmprestimoForm emprestimo={emprestimo} />);

    fireEvent.click(screen.getByText(/Excluir para sempre/i));

    await waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(excluir).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it("não mostra o botão Excluir para sempre em modo de criação", () => {
    render(<EmprestimoForm />);

    expect(screen.queryByText(/Excluir para sempre/i)).not.toBeInTheDocument();
  });

  it("não mostra o botão Cancelar empréstimo em modo de criação", () => {
    render(<EmprestimoForm />);

    expect(screen.queryByText(/Cancelar empréstimo/i)).not.toBeInTheDocument();
  });

  it("mostra o botão Cancelar empréstimo ao editar um empréstimo ativo", () => {
    const emprestimo = {
      id: 1,
      tipo: TipoDeEmprestimo.EMPRESTEI,
      pessoa: "João",
      valorTotal: BigNumber(300),
      numeroParcelas: 3,
      dataInicio: new Date(),
      status: StatusEmprestimo.ATIVO,
      parcelas: [],
    } as any;

    render(<EmprestimoForm emprestimo={emprestimo} />);

    expect(screen.getByText(/Cancelar empréstimo/i)).toBeInTheDocument();
  });

  it("não mostra o botão Cancelar empréstimo quando o empréstimo já está quitado ou cancelado", () => {
    const emprestimoQuitado = {
      id: 1,
      tipo: TipoDeEmprestimo.EMPRESTEI,
      pessoa: "João",
      status: StatusEmprestimo.QUITADO,
      dataInicio: new Date(),
      parcelas: [],
    } as any;

    const { rerender } = render(<EmprestimoForm emprestimo={emprestimoQuitado} />);
    expect(screen.queryByText(/Cancelar empréstimo/i)).not.toBeInTheDocument();

    const emprestimoCancelado = { ...emprestimoQuitado, status: StatusEmprestimo.CANCELADO };
    rerender(<EmprestimoForm emprestimo={emprestimoCancelado} />);
    expect(screen.queryByText(/Cancelar empréstimo/i)).not.toBeInTheDocument();
  });
});
