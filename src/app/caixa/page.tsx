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
import Link from "next/link";

function CaixaPage() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
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
                  <div className="card-header d-flex justify-content-between">
                    <h4 className="m-0">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
                    <Link href={`/caixa/copia?month=${key}`} className="btn btn-dark">Copiar mês</Link>
                  </div>
                  <div className="card-body d-flex align-items-start flex-column-reverse flex-lg-row justify-content-lg-around">
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

