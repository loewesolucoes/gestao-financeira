"use client";
import { useEnv } from "@/app/contexts/env";
import { NumberUtil } from "../../utils/number";
import { TransacoesAcumuladasPorMesHome } from "@/app/repositories/transacoes";

import type { ApexOptions } from "apexcharts";
import { ChartWrapper, ChartPalette, defaultChartOptions } from "../general-chart";

interface CustomProps {
  transacoesAcumuladasPorMes: TransacoesAcumuladasPorMesHome[];
}

export function GraficoCaixaAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
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
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoBalancoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
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
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaVariacaoPercentualAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
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
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes),
    },
    yaxis: { labels: { formatter: (value: number) => NumberUtil.toPercent(value), }, },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

export function GraficoCaixaVariacaoAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
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
      min: getMinimumDateFromSerie(transacoesAcumuladasPorMes),
    },
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}

function getMinimumDateFromSerie(serie: { mes: string }[]) {
  const lastFive = serie?.slice(-12) || [];
  const minDate = lastFive.length > 0 ? Date.parse(lastFive[0]?.mes) : undefined;

  return minDate;
}