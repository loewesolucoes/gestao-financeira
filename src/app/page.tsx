"use client";

import "./page.scss";
// import { add, multiply, divide, format } from "mathjs";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Layout } from "./shared/layout";
import { useStorage } from "./contexts/storage";
import { Transacoes, PeriodoTransacoes, TableNames, TotaisHome } from "./utils/db-repository";
import { Loader } from "./components/loader";
import { NumberUtil } from "./utils/number";
import { Input } from "./components/input";

function Home() {
  const { isDbOk, repository } = useStorage();

  const [yearAndMonth, setYearAndMonth] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [totais, setTotais] = useState<TotaisHome>({} as any);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    const result = await repository.totais();

    console.log(result);

    setTotais(result);
    setIsLoading(false);
  }

  const { despesas, receitas, valorEmCaixa } = totais
  const sobra = receitas?.minus(despesas?.abs())

  return (
    <main className="main container">
      <section className="home m-5">
        {isLoading
          ? (<section className="cards"><Loader /></section>)
          : (
            Object.keys(totais).length === 0
              ? (<div className="alert alert-info" role="alert">Nenhum dado encontrado</div>)
              : (
                <section className="d-flex flex-column gap-3">
                  <section className="card border-primary">
                    <h4 className="card-header">Caixa Geral</h4>
                    <div className="card-body">
                      <div className="d-flex gap-3">
                        <h5>Valor em caixa</h5>
                        <div className="d-flex flex-column">
                          <p className="m-0">{NumberUtil.toCurrency(valorEmCaixa)}</p>
                          <small>{NumberUtil.extenso(valorEmCaixa)}</small>
                        </div>
                      </div>
                      <div className="d-flex gap-3 mt-3">
                        <h5>Mês atual</h5>
                        <div className="form-floating">
                          <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                          <label htmlFor="data" className="form-label">Mês a aplicar</label>
                        </div>
                      </div>
                    </div>
                  </section>
                  <section className="card border-dark">
                    <h4 className="card-header">Caixa Mensal</h4>
                    <div className="card-body">
                      <div className="d-flex gap-3">
                        <h5>Receitas:</h5>
                        <div className="d-flex flex-column">
                          <p className="m-0">{NumberUtil.toCurrency(receitas)}</p>
                          <small>{NumberUtil.extenso(receitas)}</small>
                        </div>
                      </div>
                      <div className="d-flex gap-3">
                        <h5>Depesas:</h5>
                        <div className="d-flex flex-column">
                          <p className="m-0">{NumberUtil.toCurrency(despesas)}</p>
                          <small>{NumberUtil.extenso(despesas)}</small>
                        </div>
                      </div>
                      <div className="d-flex gap-3">
                        <h5>Sobra:</h5>
                        <div className="d-flex flex-column">
                          <p className="m-0">{NumberUtil.toCurrency(sobra)}</p>
                          <small>{NumberUtil.extenso(sobra)}</small>
                        </div>
                      </div>
                    </div>
                  </section>
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
