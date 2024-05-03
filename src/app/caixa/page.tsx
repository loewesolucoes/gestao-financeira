"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useStorage } from "../contexts/storage";
import { useEffect, useState } from "react";
import { Caixa, PeriodoTransacoes } from "../utils/db-repository";
import { SimuladorUtil } from "../utils/simulador";
import moment from "moment";
import BigNumber from "bignumber.js";
import { Loader } from "../components/loader";
import { PeriodoForm } from "./components/periodos-transacoes";
import { Doughnut } from "react-chartjs-2";

function Caixa() {
  const { isDbOk, repository } = useStorage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [transacoes, setTransacoes] = useState<{ [key: string]: Caixa[] }>({});
  const [periodo, setPeriodo] = useState<PeriodoTransacoes>(PeriodoTransacoes.ULTIMO_MES);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk, periodo]);

  async function load() {
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
        <PeriodoForm onChange={(x: PeriodoTransacoes) => setPeriodo(x)} value={periodo} />

        {isLoading
          ? <Loader />
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
      </article>
    </main>
  );
}

function ListaCaixa({ periodo }: { periodo: Caixa[] }) {
  return <ul className="list-group">
    {periodo.map((x, i) => (
      <li key={`${x.local}:${i}`} className="list-group-item">
        <div className="d-flex w-100 justify-content-between">
          <h5>{x.local}</h5>
          <small>{x.data.format('DD/MM/YY')}</small>
        </div>
        <p>R$ {x.valor?.toNumber()}</p>
      </li>
    ))}
  </ul>;
}

function BalancoDoMes({ periodo }: { periodo: Caixa[] }) {
  const somaPeriodo = periodo.reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

  return <div className="totals">
    <h5>Balanço do mes</h5>
    <p>R$ {somaPeriodo.toNumber()}</p>
    <small>{SimuladorUtil.extenso(somaPeriodo)}</small>
    <GraficoBalancoDoMes periodo={periodo} />
  </div>;
}

function GraficoBalancoDoMes({ periodo }: { periodo: Caixa[] }) {
  const somaEntradas = periodo.filter(x => x.valor && x.valor?.toNumber() >= 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))
  const somaSaidas = periodo.filter(x => x.valor && x.valor?.toNumber() < 0).reduce((p, n) => p.plus(n.valor || 0), BigNumber(0))

  return <Doughnut data={{
    labels: ['Entradas', 'Saidas'],
    datasets: [
      {
        label: 'soma em reais (R$)',
        data: [somaEntradas, somaSaidas],
        backgroundColor: [
          '#65a148',
          '#dc3545',
        ],
        hoverOffset: 4,
      },
    ],
  }} options={{
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    }
  }} />;
}

export default function Page() {
  return (
    <Layout>
      <Caixa />
    </Layout>
  );
}

