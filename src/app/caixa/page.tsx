"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { useEffect, useState } from "react";
import { Caixa } from "../utils/db-repository";
import { SimuladorUtil } from "../utils/simulador";
import moment from "moment";
import BigNumber from "bignumber.js";

function Caixa() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    const result = await repository.list();
    const transacoes = {} as any;

    result.forEach(x => {
      const period = x.data.format('YYYY-MM');
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
      {Object.keys(transacoes).map(key => {
        const periodo = transacoes[key];

        const somaPeriodo = periodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

        return (
          <section className="card">
            <h4 className="card-header">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
            <div className="card-body d-flex justify-content-around">
              <div className="totals">
                <h5>Balanço do mes</h5>
                <p>R$ {somaPeriodo.toNumber()}</p>
                <small>{SimuladorUtil.extenso(somaPeriodo)}</small>
              </div>
              <ul className="list-group">
                {periodo.map(x => (
                  <li className="list-group-item">
                    <div className="d-flex w-100 justify-content-between">
                      <h5>{x.local}</h5>
                      <small>{x.data.format('DD/MM/YY')}</small>
                    </div>
                    <p>R$ {x.valor?.toNumber()}</p>
                    <p>{SimuladorUtil.extenso(x.valor)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )
      })}
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Caixa />
    </Layout>
  );
}

