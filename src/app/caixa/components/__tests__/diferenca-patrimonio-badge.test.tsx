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

  it("renderiza badge com estilo info e o valor quando há diferença positiva", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-06" diferencaPatrimonioCaixa={BigNumber(500)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-bg-info");
    expect(badge).toHaveTextContent("2024");
    expect(badge).not.toHaveTextContent("Sem diferença");
  });

  it("renderiza badge com estilo info quando há diferença negativa", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-07" diferencaPatrimonioCaixa={BigNumber(-800)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("text-bg-info");
  });

  it("mostra 'Sem diferença' quando o valor é zero", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-08" diferencaPatrimonioCaixa={BigNumber(0)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toHaveTextContent("Sem diferença");
  });

  it("mostra 'Sem diferença' quando o valor é undefined", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2024-09" diferencaPatrimonioCaixa={undefined} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toHaveTextContent("Sem diferença");
  });

  it("mostra 'Sem diferença' quando o valor arredonda para zero (evita '-R$ 0,00')", () => {
    render(<DiferencaPatrimonioBadge mesPatrimonio="2026-07" diferencaPatrimonioCaixa={BigNumber(-0.001)} />);

    const badge = screen.getByText(/Diferença/i);
    expect(badge).toHaveTextContent("Sem diferença");
    expect(badge).not.toHaveTextContent("R$");
  });
});
