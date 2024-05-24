"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { PeriodoForm } from "../caixa/components/periodo-form";
import { TransacaoForm } from "../caixa/components/transacao-form";
import { PeriodoTransacoes, TableNames } from "../utils/db-repository";
import { useEffect, useState } from "react";
import { TransacoesPorMes } from "../caixa/components/transacoes-por-mes";

function Saldos() {
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
    document.title = `Saldos | ${document.title}`
  }, []);

  return (
    <main className="saldos container mt-3">
      <h1>Saldos</h1>
      <article className="transacoes">
        <section className="forms">
          <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />
          <TransacaoForm tableName={TableNames.SALDOS} />
        </section>

        <TransacoesPorMes tableName={TableNames.SALDOS} periodo={periodo} />
      </article>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Saldos />
    </Layout>
  );
}

