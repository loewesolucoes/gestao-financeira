"use client";
import { Doughnut, Line } from "react-chartjs-2";
import { NumberUtil } from "../../utils/number";
import BigNumber from "bignumber.js";
import { Transacoes } from "@/app/repositories/transacoes";
import { useStorage } from "@/app/contexts/storage";

export function CaixaTotaisDoMes({ transacoesDoPeriodo, transacoesAcumuladasPorMes }: { transacoesDoPeriodo: Transacoes[], transacoesAcumuladasPorMes: any }) {
  const somaPeriodo = transacoesDoPeriodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0));

  return <div className="totals d-flex flex-column gap-3">
    <div className="card card-material-1 w-100">
      <div className="card-body">
        <h5>Balanço do mês</h5>
        <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
        <small>{NumberUtil.extenso(somaPeriodo)}</small>
      </div>
    </div>
    <div className="card card-material-1">
      <div className="card-body">
        <h6>Receitas por categoria</h6>
        <GraficoMesPorCategoria forReceitas={true} transacoesDoPeriodo={transacoesDoPeriodo} />
      </div>
    </div>
    <div className="card card-material-1">
      <div className="card-body">
        <h6>Despesas por categoria</h6>
        <GraficoMesPorCategoria transacoesDoPeriodo={transacoesDoPeriodo} />
      </div>
    </div>
    <div className="card card-material-1">
      <div className="card-body">
        <h6>Caixa acumulado por mês</h6>
        <GraficoAcumuladoDoMes transacoesAcumuladasPorMes={transacoesAcumuladasPorMes} />
      </div>
    </div>
    <div className="card card-material-1">
      <div className="card-body">
        <h6>Receitas e despesas</h6>
        <GraficoBalancoDoMes transacoesDoPeriodo={transacoesDoPeriodo} />
      </div>
    </div>
  </div>;
}

export function GraficoMesPorCategoria({ transacoesDoPeriodo, forReceitas }: { transacoesDoPeriodo: Transacoes[], forReceitas?: boolean }) {
  const { repository } = useStorage();

  const filteredTransactions = transacoesDoPeriodo.filter(x => forReceitas ? x?.valor?.isGreaterThan(0) : x?.valor?.isLessThanOrEqualTo(0));
  const categorias = filteredTransactions.reduce((acc, transacao) => {
    const categoria = transacao.categoriaId || 'Sem Categoria';

    if (!acc[categoria]) {
      acc[categoria] = BigNumber(0);
    }

    acc[categoria] = acc[categoria].plus(transacao.valor || 0);

    return acc;
  }, {} as Record<string, BigNumber>);

  return filteredTransactions.length > 0 ? (
    <Doughnut data={{
      labels: Object.keys(categorias).map(key => repository?.categoriaTransacoes?.TODAS_DICT[key]?.descricao || key),
      datasets: [
        {
          label: 'soma em reais (R$)',
          data: Object.values(categorias).map(x => x.toNumber()),
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

export function GraficoBalancoDoMes({ transacoesDoPeriodo }: { transacoesDoPeriodo: Transacoes[] }) {
  const somaReceitas = transacoesDoPeriodo.filter(x => x.valor && x.valor?.isGreaterThan(0)).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))
  const somaDespesas = transacoesDoPeriodo.filter(x => x.valor && x.valor?.isLessThanOrEqualTo(0)).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))
  const possuiTransacoesComValor = transacoesDoPeriodo?.some(x => x.valor);

  return possuiTransacoesComValor ? (
    <Doughnut data={{
      labels: ['Receitas', 'Despesas'],
      datasets: [
        {
          label: 'soma em reais (R$)',
          data: [somaReceitas, somaDespesas],
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
    }} />
  ) : (
    <div className="alert alert-info" role="alert">
      Nenhum valor encontrado.
    </div>
  );
}

export function GraficoAcumuladoDoMes({ transacoesAcumuladasPorMes }: any) {
  const possuiTransacoesComValor = transacoesAcumuladasPorMes?.some(x => x?.totalAcumulado);

  return possuiTransacoesComValor ? (
    <Line data={{
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
    }} />
  ) : (
    <div className="alert alert-info" role="alert">
      Nenhum valor encontrado.
    </div>
  );
}