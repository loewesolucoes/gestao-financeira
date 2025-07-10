"use client";
import { Transacoes } from "@/app/repositories/transacoes";
import { NumberUtil } from "@/app/utils/number";
import { Doughnut } from "react-chartjs-2";
import { BigNumber } from "bignumber.js";

export function PatrimonioTotaisDoMes({ somaPeriodo, transacoesDoPeriodo }: { somaPeriodo: BigNumber; transacoesDoPeriodo: Transacoes[]; }) {
  return <div className="totals d-flex flex-column gap-3">
    <div className="card card-material-1 w-100">
      <div className="card-body">
        <h5>Soma de todos os saldos</h5>
        <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
        <small>{NumberUtil.extenso(somaPeriodo)}</small>
      </div>
    </div>
    <div className="card card-material-1 w-100">
      <div className="card-body">
        <h6>Saldos por patrimonio</h6>
        <GraficoMesPorCategoria transacoesDoPeriodo={transacoesDoPeriodo} />
      </div>
    </div>
  </div>;
}

export function GraficoMesPorCategoria({ transacoesDoPeriodo, forReceitas }: { transacoesDoPeriodo: Transacoes[], forReceitas?: boolean }) {
  const filteredTransactions = transacoesDoPeriodo.filter(x => x?.valor);
  const locais = filteredTransactions.reduce((acc, transacao) => {
    const local = transacao.local || 'Sem local descrito';

    if (!acc[local]) {
      acc[local] = BigNumber(0);
    }

    acc[local] = acc[local].plus(transacao.valor || 0);

    return acc;
  }, {} as Record<string, BigNumber>);

  return filteredTransactions.length > 0 ? (
    <Doughnut data={{
      labels: Object.keys(locais),
      datasets: [
        {
          label: 'soma em reais (R$)',
          data: Object.values(locais).map(x => x.toNumber()),
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
    }} />
  ) : (
    <div className="alert alert-info" role="alert">
      {forReceitas ? 'Nenhuma receita encontrada.' : 'Nenhuma despesa encontrada.'}
    </div>
  );
}