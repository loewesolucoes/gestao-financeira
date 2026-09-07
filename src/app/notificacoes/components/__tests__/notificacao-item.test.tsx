import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { NotificacaoItem } from "../notificacao-item";
import { TipoDeNotificacao, Notificacao } from "@/app/repositories/notificacoes";

jest.mock("../../../utils/markdown", () => ({
  MarkdownUtils: {
    render: (text: string) => text ? `<p>${text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</p>` : '',
  },
}));

function buildItem(overrides: Partial<Notificacao> = {}): Notificacao {
  return {
    id: 1,
    tipo: TipoDeNotificacao.NOTIFICACAO,
    titulo: "Falha ao salvar no Google Drive",
    descricao: "**Erro** ao salvar os dados.",
    lida: false,
    data: new Date(2024, 5, 1, 10, 0, 0),
    createdDate: new Date(2024, 5, 1, 10, 0, 0),
    ...overrides,
  };
}

describe("NotificacaoItem", () => {
  it("renderiza título e descrição em markdown", () => {
    render(<NotificacaoItem item={buildItem()} onMarcarComoLida={jest.fn()} />);

    expect(screen.getByText("Falha ao salvar no Google Drive")).toBeInTheDocument();
    expect(screen.getByText("Erro", { selector: "strong" })).toBeInTheDocument();
  });

  it("chama onMarcarComoLida ao clicar em item não lido", () => {
    const onMarcarComoLida = jest.fn();
    render(<NotificacaoItem item={buildItem({ lida: false })} onMarcarComoLida={onMarcarComoLida} />);

    fireEvent.click(screen.getByRole("button"));

    expect(onMarcarComoLida).toHaveBeenCalledTimes(1);
  });

  it("não chama onMarcarComoLida ao clicar em item já lido", () => {
    const onMarcarComoLida = jest.fn();
    const { container } = render(<NotificacaoItem item={buildItem({ lida: true })} onMarcarComoLida={onMarcarComoLida} />);

    fireEvent.click(container.querySelector("li")!);

    expect(onMarcarComoLida).not.toHaveBeenCalled();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
