"use client";
import { Doughnut } from "react-chartjs-2";
import { Caixa } from "../../utils/db-repository";
import { NumberUtil } from "../../utils/number";
import BigNumber from "bignumber.js";

export function BalancoDoMes({ periodo }: { periodo: Caixa[]; }) {
  const somaPeriodo = periodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0));

  return <div className="totals">
    <h5>Balanço do mes</h5>
    <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
    <small>{NumberUtil.extenso(somaPeriodo)}</small>
    <GraficoBalancoDoMes periodo={periodo} />
  </div>;
}

export function GraficoBalancoDoMes({ periodo }: { periodo: Caixa[] }) {
  const somaEntradas = periodo.filter(x => x.valor && x.valor?.toNumber() >= 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))
  const somaSaidas = periodo.filter(x => x.valor && x.valor?.toNumber() < 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

  return <Doughnut data={{
    labels: ['Entradas', 'Saidas'],
    datasets: [
      {
        label: 'soma em reais (R$)',
        data: [somaEntradas, somaSaidas],
        backgroundColor: [
          '#65a148',
          '#dc3545',
        ],
        hoverOffset: 4,
      },
    ],
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    }
  }} />;
}