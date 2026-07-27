"use client";
import { GraficoCaixaAcumuladoMesAMes, GraficoBalancoMesAMes, GraficoCaixaVariacaoAcumuladoMesAMes, GraficoCaixaVariacaoPercentualAcumuladoMesAMes, GraficoCaixaAcumuladoMesAMesComNotas, GraficoCaixaPorCategoria } from "./graficos";
import { TransacoesAcumuladasPorMesHome, PeriodoTransacoes, TransacoesComNotasECategoria } from "../../repositories/transacoes";

export function HomeCharts({ transacoesAcumuladaPorMes, transacoesComNotasECategorias, periodo }: { transacoesAcumuladaPorMes: TransacoesAcumuladasPorMesHome[]; transacoesComNotasECategorias: TransacoesComNotasECategoria[]; periodo: PeriodoTransacoes; }) {
  return (
    <div className="home-charts d-flex flex-column gap-3">
      <div className="d-flex flex-column flex-xl-row gap-3">
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Caixa acumulado mês a mês</h4>
            <GraficoCaixaAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} periodo={periodo} />
          </div>
        </section>
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Balanço mês a mês</h4>
            <GraficoBalancoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} periodo={periodo} />
          </div>
        </section>
      </div>
      {/* FIXME: Uncomment the following section if you want to include the charts with notes and categories */}
      {/* <div className="d-flex flex-column flex-xl-row gap-3">
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Caixa acumulado mês a mês com notas</h4>
            <GraficoCaixaAcumuladoMesAMesComNotas transacoesComNotasECategorias={transacoesComNotasECategorias} periodo={periodo} />
          </div>
        </section>
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Caixa por categoria</h4>
            <GraficoCaixaPorCategoria transacoesComNotasECategorias={transacoesComNotasECategorias} periodo={periodo} />
          </div>
        </section>
      </div> */}
      <div className="d-flex flex-column flex-xl-row gap-3">
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Variação (R$) do caixa mês a mês</h4>
            <GraficoCaixaVariacaoAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} periodo={periodo} />
          </div>
        </section>
        <section className="card card-chart card-material-1 w-100">
          <div className="card-body">
            <h4 className="card-title">Variação percentual (%) do caixa mês a mês</h4>
            <GraficoCaixaVariacaoPercentualAcumuladoMesAMes transacoesAcumuladasPorMes={transacoesAcumuladaPorMes} periodo={periodo} />
          </div>
        </section>
      </div>
    </div>
  );
}
