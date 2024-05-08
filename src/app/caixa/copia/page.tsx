"use client";

import { Layout } from "@/app/shared/layout";
import "./page.scss";
import { useSearchParams } from "next/navigation";
import moment from "moment";
import { useStorage } from "@/app/contexts/storage";
import { useEffect, useState } from "react";
import { Caixa, TableNames, TipoDeReceita } from "@/app/utils/db-repository";
import { ListaCaixa } from "../components/lista-caixa";
import { BalancoDoMes } from "../components/balanco-do-mes";
import { Loader } from "@/app/components/loader";
import { NumberUtil } from "@/app/utils/number";
import { Input } from "@/app/components/input";
import BigNumber from "bignumber.js";

function CopiaCaixaPage() {
  const params = useSearchParams()
  const month = params.get('month');
  const momentMonth = moment(month, 'YYYY-MM');

  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [yearAndMonth, setYearAndMonth] = useState<Date>(new Date());
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

  async function save() {
    console.log(yearAndMonth, transacoes);
  }

  function removerTransacao(transacao: Caixa) {
    const index = transacoes.indexOf(transacao)

    const nextTransacoes = [...transacoes]

    nextTransacoes.splice(index, 1);
    setTransacoes(nextTransacoes);
  }

  function setValorTransacao(valor: BigNumber, transacao: Caixa) {
    const index = transacoes.indexOf(transacao)
    const nextTransacoes = [...transacoes]

    nextTransacoes[index].valor = valor;
    setTransacoes(nextTransacoes);
  }

  return (
    <main className="caixa container mt-3 d-flex flex-column gap-3">
      <h1>Copiar transações do mês: {momentMonth.format('MMMM YYYY')}</h1>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : (
          <>
            <ul className="list-group">
              {transacoes.map((x, i) => (
                <li key={`${x.local}:${i}`} className={`list-group-item ${x.valor ?? 'list-group-item-warning'}`}>
                  <div className="d-flex w-100 justify-content-between gap-3">
                    <h5>{x.local}</h5>
                    <div className="d-flex justify-content-between gap-3">
                      <small>{moment(new Date()).format('DD/MM/YY')}</small>
                      <small className={x.tipo === TipoDeReceita.FIXO ? 'text-primary' : 'text-info'}>{x.tipo === TipoDeReceita.FIXO ? 'Fixo' : 'Variável'}</small>
                    </div>
                  </div>
                  <div className="d-flex w-100 justify-content-between gap-3">
                    <Input type="number" className="form-control" id="valorAplicado" groupSymbolLeft="R$" onChange={y => setValorTransacao(y, x)} value={x.valor} />
                    <button className="btn btn-danger" onClick={e => removerTransacao(x)}>Remover</button>
                  </div>
                  <small>{x.comentario}</small>
                </li>
              ))}
            </ul>
            <div className="d-flex justify-content-center justify-content-lg-end">
              <div className="d-flex gap-3 flex-column flex-lg-row">
                <div className="form-floating">
                  <Input type="month" className="form-control" id="data" placeholder="Mês a aplicar" value={yearAndMonth} onChange={x => setYearAndMonth(x)} />
                  <label htmlFor="data" className="form-label">Mês a aplicar</label>
                </div>
                <button type="button" className="btn btn-primary" onClick={e => save()}>Copiar transações para o mês</button>
              </div>
            </div>
          </>
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

