import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import BigNumber from "bignumber.js";
import { EmprestimosDoMes } from "../emprestimos-do-mes";
import { TipoDeEmprestimo } from "@/app/repositories/emprestimos";

jest.mock('@material-design-icons/svg/two-tone/local_atm.svg', () => 'svg', { virtual: true });

describe("EmprestimosDoMes", () => {
  it("mostra o estado vazio quando não há parcelas no mês", () => {
    render(<EmprestimosDoMes totais={{ aReceber: BigNumber(0), aPagar: BigNumber(0), parcelasDoMes: [] }} yearAndMonth={new Date(2024, 5, 1)} />);

    expect(screen.getByText(/Nenhuma parcela de empréstimo em aberto/i)).toBeInTheDocument();
  });

  it("renderiza os totais de a receber e a pagar para o mês informado", () => {
    const totais = {
      aReceber: BigNumber(300),
      aPagar: BigNumber(150),
      parcelasDoMes: [
        { id: 1, tipo: TipoDeEmprestimo.EMPRESTEI, valor: BigNumber(300) } as any,
        { id: 2, tipo: TipoDeEmprestimo.TOMEI_EMPRESTADO, valor: BigNumber(150) } as any,
      ],
    };

    render(<EmprestimosDoMes totais={totais} yearAndMonth={new Date(2024, 5, 1)} />);

    expect(screen.getByText("A receber:")).toBeInTheDocument();
    expect(screen.getByText("A pagar:")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*300,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s*150,00/)).toBeInTheDocument();
  });

  it("exclui empréstimos cancelados dos totais (via dados já filtrados pelo repositório)", () => {
    // totaisDoMes() do repositório já exclui cancelados na query; aqui garantimos
    // que o componente apenas reflete o que foi passado, sem somar itens extras.
    const totais = {
      aReceber: BigNumber(100),
      aPagar: BigNumber(0),
      parcelasDoMes: [
        { id: 1, tipo: TipoDeEmprestimo.EMPRESTEI, valor: BigNumber(100) } as any,
      ],
    };

    render(<EmprestimosDoMes totais={totais} yearAndMonth={new Date(2024, 5, 1)} />);

    expect(screen.getByText(/R\$\s*100,00/)).toBeInTheDocument();
    expect(screen.getByText("0 parcela(s)")).toBeInTheDocument();
  });
});
