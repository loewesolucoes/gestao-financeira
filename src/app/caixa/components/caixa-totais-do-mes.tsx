"use client";
import { NumberUtil } from "../../utils/number";
import BigNumber from "bignumber.js";
import { Transacoes } from "@/app/repositories/transacoes";
import { useStorage } from "@/app/contexts/storage";
import { ChartWrapper } from "@/app/components/general-chart";

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

  const labels = Object.keys(categorias).map(key => repository?.categoriaTransacoes?.TODAS_DICT[key]?.descricao || key);
  const data = Object.values(categorias).map(x => forReceitas ? x.toNumber() : x.abs().toNumber());

  return filteredTransactions.length > 0 ? (
    <ChartWrapper
      type="pie"
      series={data}
      options={{
        labels,
        legend: { position: 'bottom' },
        responsive: [{
          breakpoint: 480,
          options: {
            legend: { position: 'bottom' }
          }
        }]
      }}
      width="100%"
      height={300}
    />
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
    <ChartWrapper
      type="pie"
      series={[somaReceitas.toNumber(), somaDespesas.abs().toNumber()]}
      options={{
        labels: ['Receitas', 'Despesas'],
        colors: ['#65a148', '#dc3545'],
        legend: { position: 'bottom' },
        responsive: [{
          breakpoint: 480,
          options: {
            legend: { position: 'bottom' }
          }
        }]
      }}
      width="100%"
      height={300}
    />
  ) : (
    <div className="alert alert-info" role="alert">
      Nenhum valor encontrado.
    </div>
  );
}

export function GraficoAcumuladoDoMes({ transacoesAcumuladasPorMes }) {
  const possuiTransacoesComValor = transacoesAcumuladasPorMes?.some(x => x?.totalAcumulado);

  const labels = transacoesAcumuladasPorMes.map(x => x.mes);
  const data = transacoesAcumuladasPorMes.map(x => x.totalAcumulado);

  return possuiTransacoesComValor ? (
    <ChartWrapper
      type="area"
      series={[
        {
          name: 'acumulado até o mes (R$)',
          data,
        }
      ]}
      options={{
        chart: {
          type: "area" as const,
          zoom: { enabled: false, autoScaleYaxis: true },
          toolbar: { show: false },
        },
        xaxis: { type: "datetime" as const, categories: labels },
        yaxis: { labels: { formatter: (value: number) => NumberUtil.toCurrency(value), }, },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
        responsive: [{
          breakpoint: 480,
          options: {
            legend: { position: 'bottom' }
          }
        }]
      }}
      width="100%"
      height={300}
    />
  ) : (
    <div className="alert alert-info" role="alert">
      Nenhum valor encontrado.
    </div>
  );
}