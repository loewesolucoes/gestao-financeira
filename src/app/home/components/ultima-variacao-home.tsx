"use client";
import { TransacoesAcumuladasPorMesHome } from "@/app/repositories/transacoes";
import { NumberUtil } from "../../utils/number";

interface CustomProps {
  transacoesAcumuladasPorMes?: TransacoesAcumuladasPorMesHome[];
}

export function UltimaVariacao({ transacoesAcumuladasPorMes }: CustomProps) {
  const ultimaTransacao: TransacoesAcumuladasPorMesHome = (transacoesAcumuladasPorMes ?? []).length == 0 ? {} : transacoesAcumuladasPorMes[transacoesAcumuladasPorMes.length - 1] as any;

  return <section className="card border-dark card-chart">
    <h4 className="card-header">Variações percentual até o mês</h4>
    <div className="card-body">
      {ultimaTransacao == null
        ? (<div className="alert alert-info" role="alert">Mês sem dados</div>)
        : (
          <>
            <div className="d-flex gap-3">
              <h5>Variação mês:</h5>
              <div className="d-flex flex-column">
                <p>
                  {NumberUtil.toPercent(ultimaTransacao.variacaoPercentualMes)}
                  {/* Valor:
                      <small>{NumberUtil.toCurrency(ultimaTransacao.variacaoMes)}</small> */}
                </p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <h5>Variação trimestral:</h5>
              <div className="d-flex flex-column">
                <p>{NumberUtil.toPercent(ultimaTransacao.variacaoPercentualTrimestral)}</p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <h5>Variação semestral:</h5>
              <div className="d-flex flex-column">
                <p>{NumberUtil.toPercent(ultimaTransacao.variacaoPercentualSemestral)}</p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <h5>Variação anual:</h5>
              <div className="d-flex flex-column">
                <p>{NumberUtil.toPercent(ultimaTransacao.variacaoPercentualAnual)}</p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <h5>Variação 3 anos:</h5>
              <div className="d-flex flex-column">
                <p>{NumberUtil.toPercent(ultimaTransacao.variacaoPercentualTresAnos)}</p>
              </div>
            </div>
          </>
        )}
    </div>
  </section>;
}
