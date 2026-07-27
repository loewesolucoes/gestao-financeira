"use client";
import { useEnv } from "@/app/contexts/env";
import { NumberUtil } from "../../utils/number";
import { PeriodoTransacoes, TransacoesAcumuladasPorMesHome } from "@/app/repositories/transacoes";

import type { ApexOptions } from "apexcharts";
import { ChartWrapper, ChartPalette, defaultChartOptions } from "../../components/general-chart";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  transacoesAcumuladasPorMes: TransacoesAcumuladasPorMesHome[];
  periodo: PeriodoTransacoes;
}

export function GraficoCaixaAcumuladoMesAMesComNotas({ transacoesComNotasECategorias, periodo }: { transacoesComNotasECategorias: any[]; periodo: PeriodoTransacoes; }) {
  const series = [
    {
      name: "acumulado até o mes (R$)",
      data: transacoesComNotasECategorias?.map(x => x.totalAcumulado?.toNumber()) || [],
    },
  ];

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'acumulado-mes-com-notas',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true },
    },
    colors: [ChartPalette.teal],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesComNotasECategorias?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesComNotasECategorias, periodo),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaPorCategoria({ transacoesComNotasECategorias, periodo }: { transacoesComNotasECategorias: any[]; periodo: PeriodoTransacoes; }) {
  const { repository } = useStorage();

  const categoriaTransacoesDict = transacoesComNotasECategorias?.reduce((prev, next) => {
    const categoria = next.categoriaId || '';

    if (!prev[categoria]) {
      prev[categoria] = [next];
    } else {
      prev[categoria].push(next);
    }

    return prev;
  }, {});

  console.log("categoriaTransacoesDict", categoriaTransacoesDict);

  const series = categoriaTransacoesDict == null ? [] : Object.keys(categoriaTransacoesDict).filter(x => x != null).map(categoria => {

    const monthlyTotalAccumulated = categoriaTransacoesDict[categoria]
      .reduce((acc, curr) => {
        const mes = curr.mes;

        acc[mes] = (acc[mes] || 0) + (curr.totalAcumulado?.toNumber() || 0);

        return acc;
      }, {} as Record<string, number>);

    console.log("monthlyTotalAccumulated", monthlyTotalAccumulated);


    return ({
      name: repository.categoriaTransacoes.TODAS_DICT[categoria]?.descricao || 'Sem Categoria',
      data: Object.keys(monthlyTotalAccumulated).map(mes => monthlyTotalAccumulated[mes]),
    });
  });

  console.log("GraficoCaixaPorCategoria series", series);

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'caixa-por-categoria',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true },
    },
    xaxis: {
      type: "datetime" as const,
      categories: transacoesComNotasECategorias?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesComNotasECategorias, periodo),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaAcumuladoMesAMes({ transacoesAcumuladasPorMes, periodo }: CustomProps) {
  const series = [
    {
      name: "acumulado até o mes (R$)",
      data: transacoesAcumuladasPorMes?.map(x => x.totalAcumulado?.toNumber()) || [],
    },
  ];

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'acumulado-mes',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true },
    },
    colors: [ChartPalette.teal],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes, periodo),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoBalancoMesAMes({ transacoesAcumuladasPorMes, periodo }: CustomProps) {
  const series = [
    {
      name: "receitas (R$)",
      data: transacoesAcumuladasPorMes?.map(x => x.receitasMes?.toNumber()) || [],
    },
    {
      name: "despesas (-R$)",
      data: transacoesAcumuladasPorMes?.map(x => x.despesasMes?.abs()?.toNumber()) || [],
    },
  ];

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'balanco-mes',
      group: "home",
      type: "area" as const,
    },
    colors: [ChartPalette.green, ChartPalette.red],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes, periodo),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaVariacaoPercentualAcumuladoMesAMes({ transacoesAcumuladasPorMes, periodo }: CustomProps) {
  const { isMobile } = useEnv();
  const series = [
    {
      name: "variação mensal (%)",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualMes?.toNumber()) || [],
    },
    {
      name: "variação trimestral (%)",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualTrimestral?.isGreaterThan(1000) ? 0 : x?.variacaoPercentualTrimestral?.toNumber()) || [],
      hidden: true,
    },
    !isMobile && {
      name: "variação semestral (%)",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualSemestral?.isGreaterThan(1000) ? 0 : x?.variacaoPercentualSemestral?.toNumber()) || [],
      hidden: true,
    },
    !isMobile && {
      name: "variação anual (%)",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualAnual?.isGreaterThan(1000) ? 0 : x?.variacaoPercentualAnual?.toNumber()) || [],
      hidden: true,
    },
  ].filter(Boolean) as any[];

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'variacao-percentual-mes',
      group: "home",
      type: "area" as const,
    },
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes, periodo),
    },
    yaxis: { labels: { formatter: (value: number) => NumberUtil.toPercent(value), }, },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaVariacaoAcumuladoMesAMes({ transacoesAcumuladasPorMes, periodo }: CustomProps) {
  const { isMobile } = useEnv();
  const series = [
    {
      name: "variação mensal",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoMes?.toNumber()) || [],
    },
    {
      name: "variação trimestral",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoTrimestral?.isGreaterThan(1000) ? 0 : x?.variacaoTrimestral?.toNumber()) || [],
      hidden: true,
    },
    !isMobile && {
      name: "variação semestral",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoSemestral?.isGreaterThan(1000) ? 0 : x?.variacaoSemestral?.toNumber()) || [],
      hidden: true,
    },
    !isMobile && {
      name: "variação anual",
      data: transacoesAcumuladasPorMes?.map(x => x.variacaoAnual?.isGreaterThan(1000) ? 0 : x?.variacaoAnual?.toNumber()) || [],
      hidden: true,
    },
  ].filter(Boolean) as any[];

  const options: ApexOptions = {
    ...defaultChartOptions,
    chart: {
      ...defaultChartOptions.chart,
      id: 'variacao-mes',
      group: "home",
      type: "area" as const,
    },
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes, periodo),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

function getMinimumDateFromSerie(serie: { mes: string }[], periodo: PeriodoTransacoes): number | undefined {
  if (periodo === PeriodoTransacoes.TODO_HISTORICO || !serie || serie.length === 0)
    return undefined;

  const lastFive = serie?.slice(-(periodo ?? 4)) || [];
  const minDate = lastFive.length > 0 ? Date.parse(lastFive[0]?.mes) : undefined;

  return minDate;
}