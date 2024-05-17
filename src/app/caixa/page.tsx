"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { useEffect, useState } from "react";

import { Caixa, PeriodoTransacoes, TableNames, TransacoesAcumuladasPorMes } from "../utils/db-repository";
import moment from "moment";
import { Loader } from "../components/loader";
import { PeriodoForm } from "./components/periodo-form";
import { ListaCaixa } from "./components/lista-caixa";
import { BalancoDoMes } from "./components/balanco-do-mes";
import { TransacaoForm } from "./components/transacao-form";
import Link from "next/link";
import { NumberUtil } from "../utils/number";
import BigNumber from "bignumber.js";

function CaixaPage() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [valorEmCaixa, setValorEmCaixa] = useState<BigNumber>();
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});
  const [transacoesAcumuladaPorMes, setTransacoesAcumuladaPorMes] = useState<{ [key: string]: TransacoesAcumuladasPorMes }>({});
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    setIsLoading(true);
    await loadTransactions();
    await loadTotals();
    setIsLoading(false);
  }

  async function loadTotals() {
    const result = await repository.totais();

    console.info('loadTotals', result);

    setValorEmCaixa(result.valorEmCaixa);

    const dict = result.transacoesAcumuladaPorMes?.reduce((previous, next) => {
      previous[next.mes] = next;

      return previous;
    }, {} as any);

    setTransacoesAcumuladaPorMes(dict);
  }

  async function loadTransactions() {
    const result = await repository.list(TableNames.TRANSACOES, periodo);

    const dict = result.reduce((previous, next) => {
      const period = moment(next.data).format('YYYY-MM');
      const transOfMonth = previous[period] || [];

      transOfMonth.push(next);
      previous[period] = transOfMonth;

      return previous
    }, {} as any);

    setTransacoes(dict);
  }

  return (
    <main className="caixa container mt-3">
      <section className="d-flex justify-content-between">
        <h1>Caixa</h1>
        <div className="d-flex justify-content-between gap-3">
          <h5>Valor em caixa: </h5>
          <p className="d-flex flex-column">
            {NumberUtil.toCurrency(valorEmCaixa)}
            <small>{NumberUtil.extenso(valorEmCaixa, { mode: 'currency', currency: { type: 'BRL' } })}</small>
          </p>
        </div>
      </section>

      <article className="transacoes">
        <section className="forms">
          <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />
          <TransacaoForm />
        </section>

        <section className="periodos">
          {isLoading
            ? <Loader className="align-self-center my-5" />
            : Object.keys(transacoes).map(key => {
              const periodo = transacoes[key] || [];
              const acumulado = transacoesAcumuladaPorMes[key] || {} as any;
              const dataAtual = moment(acumulado.mes, 'YYYY-MM')
              const dataAtualMenos5Meses = dataAtual.clone().add(-5, 'month')

              const acumuladoAteOMes = Object.values(transacoesAcumuladaPorMes).filter(x => {
                const data = moment(x.mes, 'YYYY-MM')

                return data.isSameOrAfter(dataAtualMenos5Meses) && data.isSameOrBefore(dataAtual);
              });

              return (
                <section key={key} className="card my-3">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h4 className="m-0">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
                    <small>Valor em caixa no periodo: {NumberUtil.toCurrency(acumulado.totalAcumulado)}</small>
                    <div className="actions d-flex gap-3">
                      <Link href={`/caixa/editar-mes?month=${key}`} className="btn btn-dark">Editar mês</Link>
                      <Link href={`/caixa/copia?month=${key}`} className="btn btn-dark">Copiar mês</Link>
                    </div>
                  </div>
                  <div className="card-body d-flex align-items-start flex-column-reverse flex-lg-row justify-content-lg-around">
                    <ListaCaixa periodo={periodo} />
                    <BalancoDoMes periodo={periodo} transacoesAcumuladasPorMes={acumuladoAteOMes} />
                  </div>
                </section>
              )
            })}
        </section>
      </article>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <CaixaPage />
    </Layout>
  );
}

