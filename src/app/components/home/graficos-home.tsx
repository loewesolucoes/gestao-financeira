"use client";
import { useEnv } from "@/app/contexts/env";
import { NumberUtil } from "../../utils/number";
import { Bar, Line } from "react-chartjs-2";
import { TransacoesAcumuladasPorMesHome } from "@/app/repositories/transacoes";

// TODO: try to change this by https://apexcharts.com/

interface CustomProps {
  transacoesAcumuladasPorMes: TransacoesAcumuladasPorMesHome[];
}

const zoomOptions = {
  pan: {
    enabled: true,
    mode: 'xy',
  },
  zoom: {
    wheel: {
      enabled: true,
    },
    pinch: {
      enabled: true
    },
    mode: 'xy',
    onZoomComplete({ chart }) {
      // This update is needed to display up to date zoom level in the title.
      // Without this, previous zoom level is displayed.
      // The reason is: title uses the same beforeUpdate hook, and is evaluated before zoom.
      chart.update('none');
    }
  }
};

export function GraficoCaixaAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
  return <Line data={{
    labels: transacoesAcumuladasPorMes?.map(x => x.mes),
    datasets: [
      {
        label: 'acumulado até o mes (R$)',
        data: transacoesAcumuladasPorMes?.map(x => x.totalAcumulado),
      },
    ],
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      zoom: zoomOptions,
    } as any,
    scales: {
      y: {
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, values) {
            return NumberUtil.toCurrency(value);
          }
        }
      }
    },
  }} />;
}
export function GraficoBalancoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
  return <Bar data={{
    labels: transacoesAcumuladasPorMes?.map(x => x.mes),
    datasets: [
      {
        label: 'receitas (R$)',
        data: transacoesAcumuladasPorMes?.map(x => x.receitasMes),
      },
      {
        label: 'despesas (-R$)',
        data: transacoesAcumuladasPorMes?.map(x => x.despesasMes?.abs()),
      },
    ],
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      zoom: zoomOptions,
    } as any,
    scales: {
      y: {
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, values) {
            return NumberUtil.toCurrency(value);
          }
        }
      },
    }
  }} />;
}

export function GraficoCaixaVariacaoPercentualAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
  const { isMobile } = useEnv();

  return <Line data={{
    labels: transacoesAcumuladasPorMes?.map(x => x.mes),
    datasets: [
      {
        label: 'variação mensal (%)',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualMes),
      },
      {
        label: 'variação trimestral (%)',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualTrimestral?.toNumber() > 1000 ? 0 : x?.variacaoPercentualTrimestral),
        hidden: true,
      },
      !isMobile && {
        label: 'variação semestral (%)',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualSemestral?.toNumber() > 1000 ? 0 : x?.variacaoPercentualSemestral),
        hidden: true,
      },
      !isMobile && {
        label: 'variação anual (%)',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoPercentualAnual?.toNumber() > 1000 ? 0 : x?.variacaoPercentualAnual),
        hidden: true,
      },
    ].filter(Boolean),
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      zoom: zoomOptions,
    } as any,
    scales: {
      y: {
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, values) {
            return NumberUtil.toPercent(value);
          }
        }
      }
    }
  }} />;
}
export function GraficoCaixaVariacaoAcumuladoMesAMes({ transacoesAcumuladasPorMes }: CustomProps) {
  const { isMobile } = useEnv();

  return <Line data={{
    labels: transacoesAcumuladasPorMes?.map(x => x.mes),
    datasets: [
      {
        label: 'variação mensal',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoMes),
      },
      {
        label: 'variação trimestral',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoTrimestral?.toNumber() > 1000 ? 0 : x?.variacaoTrimestral),
        hidden: true,
      },
      !isMobile && {
        label: 'variação semestral',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoSemestral?.toNumber() > 1000 ? 0 : x?.variacaoSemestral),
        hidden: true,
      },
      !isMobile && {
        label: 'variação anual',
        data: transacoesAcumuladasPorMes?.map(x => x.variacaoAnual?.toNumber() > 1000 ? 0 : x?.variacaoAnual),
        hidden: true,
      },
    ].filter(Boolean),
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      zoom: zoomOptions,
    } as any,
    scales: {
      y: {
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, values) {
            return NumberUtil.toCurrency(value);
          }
        }
      }
    }
  }} />;
}
