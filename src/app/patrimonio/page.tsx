"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { PeriodoForm } from "../caixa/components/periodo-form";
import { TransacaoForm } from "../caixa/components/transacao-form";
import { PeriodoTransacoes } from "../repositories/transacoes";
import { TableNames } from "../repositories/default";
import { useEffect, useState } from "react";
import { TransacoesPorMes } from "../caixa/components/transacoes-por-mes";

function Patrimonio() {
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
    document.title = `Patrimônio | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  return (
    <main className="patrimonio container mt-3">
      <h1>Patrimônio</h1>
      <article className="transacoes">
        <section className="forms">
          <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />
          <TransacaoForm tableName={TableNames.PATRIMONIO} />
        </section>

        <TransacoesPorMes tableName={TableNames.PATRIMONIO} periodo={periodo} groupByDay={true} />
      </article>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Patrimonio />
    </Layout>
  );
}

