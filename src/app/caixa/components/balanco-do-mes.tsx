"use client";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Transacoes, TransacoesAcumuladasPorMes } from "../../utils/db-repository";
import { NumberUtil } from "../../utils/number";
import BigNumber from "bignumber.js";

export function BalancoDoMes({ transacoesDoPeriodo, transacoesAcumuladasPorMes }: { transacoesDoPeriodo: Transacoes[], transacoesAcumuladasPorMes: any }) {
  const somaPeriodo = transacoesDoPeriodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0));

  return <div className="totals">
    <h5>Balanço do mes</h5>
    <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
    <small>{NumberUtil.extenso(somaPeriodo)}</small>
    <GraficoAcumuladoDoMes transacoesAcumuladasPorMes={transacoesAcumuladasPorMes} />
    <GraficoBalancoDoMes transacoesDoPeriodo={transacoesDoPeriodo} />
  </div>;
}

export function GraficoBalancoDoMes({ transacoesDoPeriodo }: { transacoesDoPeriodo: Transacoes[] }) {
  const somaEntradas = transacoesDoPeriodo.filter(x => x.valor && x.valor?.toNumber() >= 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))
  const somaSaidas = transacoesDoPeriodo.filter(x => x.valor && x.valor?.toNumber() < 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

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

// export function AcumuladoMes({ periodo }: { periodo: TransacoesAcumuladasPorMes[]; }) {
//   const somaPeriodo = periodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0));

//   return <div className="acumuladoMes">
//     <h5>Restante em caixa por Mês</h5>
//     <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
//     <small>{NumberUtil.extenso(somaPeriodo)}</small>
//     <GraficoBalancoDoMes periodo={periodo} />
//   </div>;
// }

export function GraficoAcumuladoDoMes({ transacoesAcumuladasPorMes }: any) {
  return <Line data={{
    labels: transacoesAcumuladasPorMes.map(x => x.mes),
    datasets: [
      {
        label: 'acumulado até o mes (R$)',
        data: transacoesAcumuladasPorMes.map(x => x.totalAcumulado),
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