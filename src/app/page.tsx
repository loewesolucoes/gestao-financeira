"use client";

import "./page.scss";
// import { add, multiply, divide, format } from "mathjs";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Layout } from "./shared/layout";
import { useStorage } from "./contexts/storage";
import { Caixa } from "./utils/db-repository";
import { Loader } from "./components/loader";

function Home() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [simulacoes, setSimulacoes] = useState<Caixa[]>([]);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    const result = await repository.list();

    console.log(result);

    setSimulacoes(result);
    setIsLoading(false);
  }

  return (
    <main className="main container">
      <section className="home m-5">
        {isLoading
          ? (<section className="cards"><Loader /></section>)
          : (
            simulacoes.length === 0
              ? (<div className="alert alert-info" role="alert">Nenhum dado encontrado</div>)
              : (
                <section className="cards">
                  {simulacoes.map(x => (
                    <div key={x.id.toNumber()} className="card m-3">
                      <div className="card-body">
                        <h5 className="card-title">{x.id.toNumber()}</h5>
                        <Link href={`/orcamentos?sim=${x.id}`} className="btn btn-secondary">Ver simulação</Link>
                      </div>
                    </div>
                  ))}
                </section>
              )
          )}
      </section>
    </main>
  );
}



export default function Page() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}
