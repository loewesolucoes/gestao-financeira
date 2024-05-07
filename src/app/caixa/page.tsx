"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { useEffect, useState } from "react";

import { Caixa, PeriodoTransacoes, TableNames } from "../utils/db-repository";
import moment from "moment";
import { Loader } from "../components/loader";
import { PeriodoForm } from "./components/periodo-form";
import { ListaCaixa } from "./components/lista-caixa";
import { BalancoDoMes } from "./components/balanco-do-mes";
import { TransacaoForm } from "./components/transacao-form";

function CaixaPage(): React.ReactElement {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
    console.log("page. isDbOk", isDbOk);

    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    setIsLoading(true);
    const result = await repository.list(TableNames.TRANSACOES, periodo);
    const transacoes = {} as any;

    result.forEach(x => {
      const period = moment(x.data).format('YYYY-MM');
      const transOfMonth = transacoes[period] || [];

      transOfMonth.push(x);
      transacoes[period] = transOfMonth;
    });

    setTransacoes(transacoes);
    setIsLoading(false);
  }

  return (
    <main className="caixa container mt-3">
      <h1>Caixa</h1>

      <article className="transacoes">
        <section className="forms">
          <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />
          <TransacaoForm />
        </section>

        <section className="periodos">
          {isLoading
            ? <Loader className="align-self-center my-5" />
            : Object.keys(transacoes).map(key => {
              const periodo = transacoes[key];

              return (
                <section key={key} className="card my-3">
                  <h4 className="card-header">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
                  <div className="card-body d-flex justify-content-around">
                    <ListaCaixa periodo={periodo} />
                    <BalancoDoMes periodo={periodo} />
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

