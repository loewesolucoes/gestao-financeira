import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MetasForm } from "../metas-form";
import '@testing-library/jest-dom';
import { TipoDeMeta } from "@/app/repositories/metas";

// Mock useStorage context
describe("MetasForm", () => {
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
    render(<MetasForm />);
    expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data de conclusão/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tipo de meta/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Comentário/i)).toBeInTheDocument();
  });

  it("chama onCustomSubmit ao submeter", async () => {
    const onCustomSubmit = jest.fn();
    const { container } = render(<MetasForm onCustomSubmit={onCustomSubmit} />);

    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: "Viagem" } });
    fireEvent.change(screen.getByLabelText(/Data de conclusão/i), { target: { value: "2024-06" } });
    fireEvent.change(screen.getByLabelText(/Tipo de meta/i), { target: { value: TipoDeMeta.FINANCEIRA } });
    fireEvent.change(screen.getByPlaceholderText(/Comentário/i), { target: { value: "Meta de longo prazo" } });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onCustomSubmit).toHaveBeenCalled());
  });

  it("mostra loading ao submeter", async () => {
    const { container } = render(<MetasForm onCustomSubmit={console.debug} />);

    fireEvent.submit(container.querySelector("form")!);

    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
