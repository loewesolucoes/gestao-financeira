"use client";
import moment from "moment";
import { Loader } from "../../components/loader";
import { ListaCaixa } from "./lista-caixa";
import { CaixaTotaisDoMes } from "./caixa-totais-do-mes";
import Link from "next/link";
import { NumberUtil } from "../../utils/number";
import { useEffect, useState } from "react";
import { useStorage } from "@/app/contexts/storage";
import BigNumber from "bignumber.js";
import { PeriodoTransacoes, Transacoes, TransacoesAcumuladasPorMes } from "@/app/repositories/transacoes";
import { TableNames } from "@/app/repositories/default";
import { PatrimonioTotaisDoMes } from "./patrimonio-totais-do-mes";

interface CustomProps {
  periodo: PeriodoTransacoes
  tableName?: TableNames
  transacoesAcumuladaPorMes?: { [key: string]: TransacoesAcumuladasPorMes; }
  groupByDay?: boolean
}

export function TransacoesPorMes({ groupByDay, periodo, transacoesAcumuladaPorMes, tableName: tn }: CustomProps) {
  const { isDbOk, repository, refresh } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Transacoes[] }>({});

  const tableName = tn || TableNames.TRANSACOES
  const groupFormat = groupByDay ? 'YYYY-MM-DD' : 'YYYY-MM';
  const groupDescFormat = groupByDay ? 'DD MMMM YYYY' : 'MMMM YYYY';

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    setIsLoading(true);
    await loadTransactions();
    setIsLoading(false);
  }

  async function loadTransactions() {
    let result;

    if (tableName === TableNames.PATRIMONIO)
      result = await repository.patrimonio.listPatrimonio(periodo);
    else
      result = await repository.transacoes.listCaixa(periodo);

    const dict = result.reduce((previous, next) => {
      const period = moment(next.data).format(groupFormat);
      const transOfMonth = previous[period] || [];

      transOfMonth.push(next);
      previous[period] = transOfMonth;

      return previous
    }, {} as any);

    setTransacoes(dict);
  }

  async function removeMonthAndSave(momentPeriod: moment.Moment) {
    if (!confirm('Você tem certeza que deseja remover o mês?'))
      return;

    if (tableName === TableNames.PATRIMONIO)
      await repository.patrimonio.deletePeriod(momentPeriod.format('MM'), momentPeriod.format('YYYY'))
    else
      await repository.transacoes.deletePeriod(momentPeriod.format('MM'), momentPeriod.format('YYYY'))

    await refresh();
  }

  const keysTransacoes = Object.keys(transacoes);
  const isPatrimonio = tableName === TableNames.PATRIMONIO;

  const path = isPatrimonio ? 'patrimonio' : 'caixa';

  return (
    <section className="periodos">
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : keysTransacoes.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhuma transação encontrada para o período selecionado. Adicione uma nova transação para começar a utilizar o sistema.</div>)
          : keysTransacoes.map(key => {
            const transacoesDoPeriodo = transacoes[key] || [];
            const { acumulado, acumuladoAteOMes } = filterAcumulados(transacoesAcumuladaPorMes, key);
            const somaPeriodo = transacoesDoPeriodo.map(x => x.valor).filter(Boolean).reduce((p, n) => p.plus(n), BigNumber(0))
            const momentPeriod = moment(key, groupFormat);

            return (
              <section key={key} className="my-3 d-flex flex-column gap-3">
                <div className="d-flex justify-content-between align-items-center flex-column flex-lg-row gap-3">
                  <h4>Periodo de: {momentPeriod.format(groupDescFormat)}</h4>
                  {acumulado?.totalAcumulado && (<small>Valor em caixa no periodo: {NumberUtil.toCurrency(acumulado.totalAcumulado)}</small>)}
                  <div className="actions d-flex gap-3">
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => removeMonthAndSave(momentPeriod)}>Remover Mês</button>
                    <Link href={`/${path}/editar-mes?month=${key}`} className="btn btn-outline-dark btn-sm">Editar mês</Link>
                    <Link href={`/${path}/copia?month=${key}`} className="btn btn-outline-dark btn-sm">Copiar mês</Link>
                  </div>
                </div>
                <div className="d-flex align-items-center align-items-lg-start flex-column-reverse flex-lg-row justify-content-lg-around gap-3">
                  <ListaCaixa tableName={tableName} transacoesDoPeriodo={transacoesDoPeriodo} />
                  {!isPatrimonio && (
                    <CaixaTotaisDoMes transacoesDoPeriodo={transacoesDoPeriodo} transacoesAcumuladasPorMes={acumuladoAteOMes} />
                  )}
                  {isPatrimonio && (
                    <PatrimonioTotaisDoMes transacoesDoPeriodo={transacoesDoPeriodo} somaPeriodo={somaPeriodo} />
                  )}
                </div>
              </section>
            );
          })}
    </section>
  );
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

