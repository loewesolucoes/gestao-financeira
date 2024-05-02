"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { Fragment, useEffect, useState } from "react";
import { Caixa, PeriodoTransacoes } from "../utils/db-repository";
import { SimuladorUtil } from "../utils/simulador";
import moment from "moment";
import BigNumber from "bignumber.js";
import { Loader } from "../components/loader";

const periodosTransacoes = [
  { title: 'ultimo mes', value: PeriodoTransacoes.ULTIMO_MES },
  { title: '3 ultimos meses', value: PeriodoTransacoes.TRES_ULTIMOS_MESES },
  { title: '6 ultimos meses', value: PeriodoTransacoes.SEIS_ULTIMOS_MESES },
  { title: 'ultimo ano', value: PeriodoTransacoes.ULTIMO_ANO },
  { title: 'todo historico', value: PeriodoTransacoes.TODO_HISTORICO },
];

function Caixa() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(periodosTransacoes[0].value);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
    console.log("here");
    
    setIsLoading(true);
    const result = await repository.list(periodo);
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

      <article className="transacoes">
        <div className="btn-group my-3">
          {periodosTransacoes.map((x, i) => (
            <label key={x.value} className={`btn btn-outline-secondary ${x.value === periodo && 'active'}`} htmlFor={`periodosTransacoes${i}`}>
              <input type="radio" className="btn-check" name="periodosTransacoes" id={`periodosTransacoes${i}`} value={x.value} onChange={e => setPeriodo(Number(e.target.value))} checked={x.value === periodo} />
              {x.title}
            </label>
          ))}
        </div>

        {isLoading
          ? <Loader />
          : Object.keys(transacoes).map(key => {
            const periodo = transacoes[key];
            const somaPeriodo = periodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

            return (
              <section key={key} className="card my-3">
                <h4 className="card-header">Periodo de: {moment(key, 'YYYY-MM').format('MMMM YYYY')}</h4>
                <div className="card-body d-flex justify-content-around">
                  <div className="totals">
                    <h5>Balanço do mes</h5>
                    <p>R$ {somaPeriodo.toNumber()}</p>
                    <small>{SimuladorUtil.extenso(somaPeriodo)}</small>
                  </div>
                  <ul className="list-group">
                    {periodo.map((x, i) => (
                      <li key={`${x.local}:${i}`} className="list-group-item">
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
      </article>
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

