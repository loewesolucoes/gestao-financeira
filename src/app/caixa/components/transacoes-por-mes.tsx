"use client";
import moment from "moment";
import { Loader } from "../../components/loader";
import { ListaCaixa } from "./lista-caixa";
import { BalancoDoMes } from "./balanco-do-mes";
import Link from "next/link";
import { NumberUtil } from "../../utils/number";
import { PeriodoTransacoes, TableNames, Transacoes, TransacoesAcumuladasPorMes } from "../../utils/db-repository";
import { useEffect, useState } from "react";
import { useStorage } from "@/app/contexts/storage";
import BigNumber from "bignumber.js";

interface CustomProps {
  periodo: PeriodoTransacoes
  tableName?: TableNames
  transacoesAcumuladaPorMes?: { [key: string]: TransacoesAcumuladasPorMes; }
}

export function TransacoesPorMes({ periodo, transacoesAcumuladaPorMes, tableName: tn }: CustomProps) {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Transacoes[] }>({});

  const tableName = tn || TableNames.TRANSACOES

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    setIsLoading(true);
    await loadTransactions();
    setIsLoading(false);
  }

  async function loadTransactions() {
    const result = await repository.list(tableName, periodo);

    const dict = result.reduce((previous, next) => {
      const period = moment(next.data).format('YYYY-MM');
      const transOfMonth = previous[period] || [];

      transOfMonth.push(next);
      previous[period] = transOfMonth;

      return previous
    }, {} as any);

    setTransacoes(dict);
  }

  const keysTransacoes = Object.keys(transacoes);
  const isSaldos = tableName === TableNames.SALDOS;

  const path = isSaldos ? 'saldos' : 'caixa';

  return <section className="periodos">
    {isLoading
      ? <Loader className="align-self-center my-5" />
      : keysTransacoes.length === 0
        ? (<div className="alert alert-info my-3" role="alert">Nenhum dado encontrado</div>)
        : keysTransacoes.map(key => {
          const transacoesDoPeriodo = transacoes[key] || [];
          const { acumulado, acumuladoAteOMes } = filterAcumulados(transacoesAcumuladaPorMes, key);
          const somaPeriodo = transacoesDoPeriodo.map(x => x.valor).filter(Boolean).reduce((p, n) => p.plus(n), BigNumber(0))

          return (
            <section key={key} className="card my-3">
              <div className="card-header d-flex justify-content-between align-items-center flex-column flex-lg-row gap-3">
                <h4 className="m-0">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
                {acumulado?.totalAcumulado && (<small>Valor em caixa no periodo: {NumberUtil.toCurrency(acumulado.totalAcumulado)}</small>)}
                <div className="actions d-flex gap-3">
                  <Link href={`/${path}/editar-mes?month=${key}`} className="btn btn-dark">Editar mês</Link>
                  <Link href={`/${path}/copia?month=${key}`} className="btn btn-dark">Copiar mês</Link>
                </div>
              </div>
              <div className="card-body d-flex align-items-start flex-column-reverse flex-lg-row justify-content-lg-around">
                <ListaCaixa transacoesDoPeriodo={transacoesDoPeriodo} />
                {!isSaldos && (
                  <BalancoDoMes transacoesDoPeriodo={transacoesDoPeriodo} transacoesAcumuladasPorMes={acumuladoAteOMes} />
                )}
                {isSaldos && (
                  <div className="totals">
                    <h5>Balanço do mes</h5>
                    <p>{NumberUtil.toCurrency(somaPeriodo)}</p>
                    <small>{NumberUtil.extenso(somaPeriodo)}</small>
                  </div>
                )}
              </div>
            </section>
          );
        })}
  </section>;
}
function filterAcumulados(transacoesAcumuladaPorMes: { [key: string]: TransacoesAcumuladasPorMes; }, key: string) {
  if (transacoesAcumuladaPorMes == null)
    return { acumulado: {}, acumuladoAteOMes: [] };


  const acumulado = transacoesAcumuladaPorMes[key] || {} as any;
  const dataAtual = moment(acumulado.mes, 'YYYY-MM');
  const dataAtualMenos5Meses = dataAtual.clone().add(-5, 'month');

  const acumuladoAteOMes = Object.values(transacoesAcumuladaPorMes || {}).filter(x => {
    const data = moment(x.mes, 'YYYY-MM');

    return data.isSameOrAfter(dataAtualMenos5Meses) && data.isSameOrBefore(dataAtual);
  });

  return { acumulado, acumuladoAteOMes };
}

