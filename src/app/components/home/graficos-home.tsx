"use client";
import { useEnv } from "@/app/contexts/env";
import { NumberUtil } from "../../utils/number";
import { TransacoesAcumuladasPorMesHome } from "@/app/repositories/transacoes";

import type { ApexOptions } from "apexcharts";
import { ChartWrapper } from "../general-chart";

interface CustomProps {
  transacoesAcumuladasPorMes: TransacoesAcumuladasPorMesHome[];
}

const palette = {
  yellow: "#FFC107",
  green: "#28A745",
  red: "#DC3545",
  blue: "#007BFF",
  purple: "#6F42C1",
  gray: "#6C757D",
  teal: "#20C997",
  orange: "#FD7E14",
};

export function GraficoCaixaAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
  const series = [
    {
      name: "acumulado até o mes (R$)",
      data: transacoesAcumuladasPorMes?.map(x => x.totalAcumulado?.toNumber()) || [],
    },
  ];

  const options: ApexOptions = {
    chart: {
      id: 'acumulado-mes',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true, autoScaleYaxis: true },
      toolbar: { show: true },
    },
    colors: [palette.yellow],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
    },
    yaxis: {
      labels: {
        formatter: (value: number) => NumberUtil.toCurrency(value),
      },
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const },
    responsive: [{ breakpoint: 600, options: { chart: { width: "100%" } } }],
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
    chart: {
      id: 'balanco-mes',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true, autoScaleYaxis: true },
      toolbar: { show: true },
    },
    colors: [palette.green, palette.red],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
      // tickPlacement: 'on',
    },
    yaxis: {
      labels: {
        formatter: (value: number) => NumberUtil.toCurrency(value),
      },
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const },
    responsive: [{ breakpoint: 600, options: { chart: { width: "100%" } } }],
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
    chart: {
      id: 'variacao-percentual-mes',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true, autoScaleYaxis: true },
      toolbar: { show: true },
    },
    colors: [palette.yellow, palette.red, palette.blue, palette.purple],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
    },
    yaxis: {
      labels: {
        formatter: (value: number) => NumberUtil.toPercent(value),
      },
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const },
    responsive: [{ breakpoint: 600, options: { chart: { width: "100%" } } }],
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
    chart: {
      id: 'variacao-mess',
      group: "home",
      type: "area" as const,
      zoom: { enabled: true, autoScaleYaxis: true },
      toolbar: { show: true },
    },
    colors: [palette.yellow, palette.red, palette.blue, palette.purple],
    xaxis: {
      type: "datetime" as const,
      categories: transacoesAcumuladasPorMes?.map(x => x.mes) || [],
    },
    yaxis: {
      labels: {
        formatter: (value: number) => NumberUtil.toCurrency(value),
      },
    },
    dataLabels: { enabled: false },
    legend: { position: "bottom" as const },
    responsive: [{ breakpoint: 600, options: { chart: { width: "100%" } } }],
  };

  return <ChartWrapper options={options} series={series} type="area" height={350} />;
}
