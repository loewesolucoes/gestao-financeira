import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransacaoForm } from "../transacao-form";
import '@testing-library/jest-dom';
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita } from "@/app/repositories/transacoes";

// Mock useStorage context
describe("TransacaoForm", () => {
  beforeAll(() => {
    jest.mock("../../../contexts/storage", () => ({
      useStorage: () => ({
        isDbOk: true,
        repository: {
          save: jest.fn(async () => ({ id: 1 })),
          delete: jest.fn(async () => ({})),
        },
        refresh: jest.fn(async () => { }),
      }),
    }));
  });

  it("renderiza campos básicos", () => {
    render(<TransacaoForm />);
    expect(screen.getByLabelText(/Local/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Comentario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Valor aplicado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data/i)).toBeInTheDocument();
  });

  it("renderiza campo tipo de receita quando não é patrimonio", () => {
    render(<TransacaoForm tableName={TableNames.TRANSACOES} />);
    expect(screen.getByLabelText(/Tipo de receita/i)).toBeInTheDocument();
  });

  it("não renderiza campo tipo de receita quando é patrimonio", () => {
    render(<TransacaoForm tableName={TableNames.PATRIMONIO} />);
    expect(screen.queryByLabelText(/Tipo de receita/i)).not.toBeInTheDocument();
  });

  it("chama onCustomSubmit ao submeter", async () => {
    const onCustomSubmit = jest.fn();
    const { container } = render(<TransacaoForm onCustomSubmit={onCustomSubmit} />);

    fireEvent.change(screen.getByLabelText(/Local/i), { target: { value: "Supermercado" } });
    fireEvent.change(screen.getByLabelText(/Comentario/i), { target: { value: "Compra do mês" } });
    fireEvent.change(screen.getByLabelText(/Valor aplicado/i), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText(/Data/i), { target: { value: "2024-06-01" } });
    fireEvent.change(screen.getByLabelText(/Tipo de receita/i), { target: { value: TipoDeReceita.FIXO } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onCustomSubmit).toHaveBeenCalled());
  });

  it("mostra loading ao submeter", async () => {
    const { container } = render(<TransacaoForm onCustomSubmit={console.debug} />);

    fireEvent.submit(container.querySelector("form"));

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
