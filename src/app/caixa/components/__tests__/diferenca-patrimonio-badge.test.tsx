import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import BigNumber from "bignumber.js";
import { DiferencaPatrimonioBadge } from "../diferenca-patrimonio-badge";

describe("DiferencaPatrimonioBadge", () => {
  it("não renderiza nada quando não há mês de patrimônio", () => {
    const { container } = render(<DiferencaPatrimonioBadge mesPatrimonio={undefined} diferencaPatrimonioCaixa={BigNumber(100)} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza badge de sucesso quando a diferença é positiva", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-06" diferencaPatrimonioCaixa={BigNumber(500)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-bg-success");
    expect(badge).toHaveTextContent("2024");
  });

  it("renderiza badge de perigo quando a diferença é negativa", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-07" diferencaPatrimonioCaixa={BigNumber(-800)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-bg-danger");
  });
});
