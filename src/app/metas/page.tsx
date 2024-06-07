"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { Loader } from "../components/loader";
import { Metas, TableNames, TipoDeMeta } from "../utils/db-repository";
import moment from "moment";
import { Modal } from "../components/modal";
import { MetasForm } from "./components/metas-form";
import { EnumUtil } from "../utils/enum";

function MetasPage() {
  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metas, setMetas] = useState<{ [key: string]: Metas[] }>({});
  const [metaAEditar, setMetaAEditar] = useState<Metas>();

  useEffect(() => {
    document.title = `Metas | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    await loadMetas();
    setIsLoading(false);
  }

  async function loadMetas() {
    const result = await repository.list<Metas>(TableNames.METAS);

    const dict = result.reduce((previous, next) => {
      const period = moment(next.data).format('YYYY-MM');
      const transOfMonth = previous[period] || [];

      transOfMonth.push(next);
      previous[period] = transOfMonth;

      return previous
    }, {} as any);

    setMetas(dict);
  }


  const keysMetas = Object.keys(metas);


  return (
    <main className="metas container mt-3 d-flex flex-column gap-3">
      <h1>Metas</h1>
      <MetasForm />
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : keysMetas.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhum dado encontrado</div>)
          : keysMetas.map(key => {
            const metasDoPeriodo = metas[key] || [];
            const momentPeriod = moment(key, 'YYYY-MM');

            return (
              <section key={key} className="card my-3">
                <div className="card-header d-flex justify-content-between align-items-center flex-column flex-lg-row gap-3">
                  <h4 className="m-0">Periodo de: {momentPeriod.format('YYYY')}</h4>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {metasDoPeriodo.map((x, i) => (
                      <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao ?? 'list-group-item-info'} ${x.tipo === TipoDeMeta.PESSOAL ? 'list-group-item-success' : ''}  ${x.tipo === TipoDeMeta.FINANCEIRA ? 'list-group-item-warning' : ''}`}>
                        <div className="d-flex w-100 justify-content-between gap-3">
                          <div className="d-flex flex-column gap-3">
                            <h5>{x.descricao}</h5>
                            <p>{x.comentario}</p>
                          </div>
                          <div className="d-flex flex-column gap-3">
                            <small>{moment(x.data).format('MMMM YYYY')}</small>
                            <button className="btn btn-secondary" onClick={e => setMetaAEditar(x)}>Editar</button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {metaAEditar && (
                    <Modal hideFooter={true} onClose={() => setMetaAEditar(null)} title={`Detalhes da transação: ${metaAEditar?.descricao}`}>
                      <MetasForm meta={metaAEditar} cleanStyle={true} onClose={() => setMetaAEditar(null)} />
                    </Modal>
                  )}
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
      <MetasPage />
    </Layout>
  );
}

