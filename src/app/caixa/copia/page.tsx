"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useStorage } from "@/app/contexts/storage";
import { useEffect, useState } from "react";
import { Caixa, TableNames } from "@/app/utils/db-repository";
import { ListaCaixa } from "../components/lista-caixa";
import { BalancoDoMes } from "../components/balanco-do-mes";
import { Loader } from "@/app/components/loader";

function CopiaCaixaPage() {
  const params = useSearchParams()
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');

  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<Caixa[]>([]);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);

    const result = await repository.listByMonth(TableNames.TRANSACOES, momentMonth.get('month'), momentMonth.get('year'));

    console.log(result);

    setTransacoes(result);
    setIsLoading(false);
  }

  return (
    <main className="caixa container mt-3">
      <h1>Copiar transações do mês: {momentMonth.format('MMMM YYYY')}</h1>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : (
          <div className="card-body d-flex align-items-start flex-column-reverse flex-lg-row justify-content-lg-around">
            <ListaCaixa periodo={transacoes} />
            <BalancoDoMes periodo={transacoes} />
          </div>
        )}
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <CopiaCaixaPage />
    </Layout>
  );
}

