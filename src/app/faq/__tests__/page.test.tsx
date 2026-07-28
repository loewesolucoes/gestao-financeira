import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "../page";

// Layout pulls in AppProviders/contexts unrelated to the FAQ content itself,
// so it's mocked as a passthrough here.
jest.mock("../../shared/layout", () => ({
  Layout: ({ children }: any) => <>{children}</>,
}));

// SVGR component imports aren't transformed by the Jest/SWC setup, so the
// arrow icon is mocked as a plain element.
jest.mock("../arrow.svg", () => ({
  __esModule: true,
  default: () => <svg data-testid="arrow-icon" />,
}));

describe("FAQ Page", () => {
  it("renderiza as 11 perguntas esperadas", () => {
    render(<Page />);
    const questions = screen.getAllByRole("button");
    expect(questions).toHaveLength(11);
  });

  it("inclui perguntas representativas do domínio financeiro", () => {
    render(<Page />);
    expect(screen.getByText("Como faço para registrar minhas receitas e despesas do mês?")).toBeInTheDocument();
    expect(screen.getByText("Onde meus dados financeiros ficam armazenados? É seguro?")).toBeInTheDocument();
  });

  it("mantém a pergunta de Termos de uso e Política de Privacidade", () => {
    render(<Page />);
    expect(screen.getByText("Vocês possuem Termos de uso e Política de Privacidade?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Termos de uso/i })).toHaveAttribute("href", "/termos-de-uso");
    expect(screen.getByRole("link", { name: /Política de Privacidade/i })).toHaveAttribute("href", "/politica-de-privacidade");
  });

  it("expande a pergunta ao clicar", () => {
    render(<Page />);
    const button = screen.getByText("Como funcionam as Metas de economia?").closest("button")!;
    const listItem = button.closest("li")!;

    expect(listItem).not.toHaveClass("show");
    fireEvent.click(button);
    expect(listItem).toHaveClass("show");
  });
});
