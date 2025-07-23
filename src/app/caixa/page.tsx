"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { useEffect, useState } from "react";

import { PeriodoTransacoes, TransacoesAcumuladasPorMes } from "../repositories/transacoes";
import { PeriodoForm } from "./components/periodo-form";
import { TransacaoForm } from "./components/transacao-form";
import { NumberUtil } from "../utils/number";
import BigNumber from "bignumber.js";
import { TransacoesPorMes } from "./components/transacoes-por-mes";
import { Loader } from "../components/loader";

function CaixaPage() {
  const { isDbOk, repository } = useStorage();

  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [valorEmCaixa, setValorEmCaixa] = useState<BigNumber>();
  const [transacoesAcumuladaPorMes, setTransacoesAcumuladaPorMes] = useState<{ [key: string]: TransacoesAcumuladasPorMes }>({});

  useEffect(() => {
    document.title = `Caixa | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    setIsLoading(true);
    await loadTotals();
    setIsLoading(false);
  }

  async function loadTotals() {
    const result = await repository.transacoes.totaisCaixa();

    console.info('loadTotals', result);

    setValorEmCaixa(result.valorEmCaixa);

    const dict = result.transacoesAcumuladaPorMes?.reduce((previous, next) => {
      previous[next.mes] = next;

      return previous;
    }, {} as any);

    setTransacoesAcumuladaPorMes(dict);
  }

  return (
    <main className="caixa container mt-3">
      <section className="d-flex justify-content-between flex-column flex-xl-row">
        <h1>Caixa</h1>
        <div className="d-flex justify-content-between gap-3">
          <h5>Valor em caixa: </h5>
          {isLoading
            ? (<Loader />)
            : (
              <p className="d-flex flex-column">
                {NumberUtil.toCurrency(valorEmCaixa)}
                <small>{NumberUtil.extenso(valorEmCaixa, { mode: 'currency', currency: { type: 'BRL' } })}</small>
              </p>)}
        </div>
      </section>

      <article className="transacoes">
        <section className="forms d-flex flex-column gap-3">
          <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />
          <TransacaoForm />
        </section>

        <TransacoesPorMes periodo={periodo} transacoesAcumuladaPorMes={transacoesAcumuladaPorMes} />
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

