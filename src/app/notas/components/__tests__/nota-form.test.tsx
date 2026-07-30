import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotaForm } from "../nota-form";
import '@testing-library/jest-dom';
import { TipoDeNota } from "@/app/repositories/notas";

// Mock useStorage context
describe("NotaForm", () => {
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
    render(<NotaForm />);
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de nota/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Comentário/i)).toBeInTheDocument();
  });

  it("chama onCustomSubmit ao submeter", async () => {
    const onCustomSubmit = jest.fn();
    const { container } = render(<NotaForm onCustomSubmit={onCustomSubmit} />);

    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: "Lembrete" } });
    fireEvent.change(screen.getByLabelText(/^Data/i), { target: { value: "2024-06-01" } });
    fireEvent.change(screen.getByLabelText(/Tipo de nota/i), { target: { value: TipoDeNota.NORMAL } });
    fireEvent.change(screen.getByPlaceholderText(/Comentário/i), { target: { value: "Anotação importante" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onCustomSubmit).toHaveBeenCalled());
  });

  it("mostra loading ao submeter", async () => {
    const { container } = render(<NotaForm onCustomSubmit={console.debug} />);

    fireEvent.submit(container.querySelector("form")!);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
