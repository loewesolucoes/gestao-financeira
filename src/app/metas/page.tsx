"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { Loader } from "../components/loader";
import moment from "moment";
import { Modal } from "../components/modal";
import { MetasForm } from "./components/metas-form";
import { Metas, TipoDeMeta } from "../repositories/metas";
import { TableNames } from "../repositories/default";
import { MarkdownUtils } from "../utils/markdown";

function MetasPage() {
  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [metas, setMetas] = useState<{ [key: string]: Metas[] }>({});
  const [parsedMetas, setParsedMetas] = useState<{ [key: string]: Metas[] }>({});
  const [metaAEditar, setMetaAEditar] = useState<Metas>();

  useEffect(() => {
    document.title = `Metas | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    const parsed = Object.keys(metas).reduce((previous, next) => {
      const metasDoPeriodo = metas[next] || [];
      const parsedMetasDoPeriodo = metasDoPeriodo.map(x => ({
        ...x,
        __parsedComentario: MarkdownUtils.render(x.comentario)
      }));

      previous[next] = parsedMetasDoPeriodo;

      return previous;
    }, {} as { [key: string]: Metas[] });

    setParsedMetas(parsed);
  }, [metas]);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    await loadMetas();
    setIsLoading(false);
  }

  async function loadMetas() {
    const result = await repository.metas.list<Metas>(TableNames.METAS);

    const dict = result.reduce((previous, next) => {
      const period = moment(next.data).format('YYYY-MM');
      const transOfMonth = previous[period] || [];

      transOfMonth.push(next);
      previous[period] = transOfMonth;

      return previous
    }, {} as any);

    setMetas(dict);
  }

  const keysMetas = Object.keys(parsedMetas);

  return (
    <main className="metas container mt-3 d-flex flex-column gap-3">
      <h1>Metas</h1>
      <MetasForm />
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : keysMetas.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhuma meta encontrada para o período selecionado. Adicione uma nova meta para começar a utilizar o sistema.</div>)
          : keysMetas.sort().reverse().map(key => {
            const metasDoPeriodo = parsedMetas[key] || [];
            const momentPeriod = moment(key, 'YYYY-MM');

            return (
              <section key={key} className="my-3">
                <div className="card-header d-flex justify-content-between align-items-center flex-column flex-lg-row gap-3">
                  <h4 className="">Periodo de: {momentPeriod.format('YYYY')}</h4>
                </div>
                <ul className="list-group list-group-material-1">
                  {metasDoPeriodo.map((x, i) => (
                    <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao == null ? 'list-group-item-info' : ''} ${x.tipo === TipoDeMeta.PESSOAL ? 'list-group-item-success' : ''}  ${x.tipo === TipoDeMeta.FINANCEIRA ? 'list-group-item-warning' : ''}`}>
                      <div className="d-flex w-100 justify-content-between gap-3">
                        <div className="d-flex flex-column gap-3">
                          <h5>{x.descricao}</h5>
                          <p dangerouslySetInnerHTML={{ __html: (x as any).__parsedComentario }} />
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
                  <Modal hideFooter={true} onClose={() => setMetaAEditar(null)} title={`Detalhes da meta: ${metaAEditar?.descricao}`}>
                    <MetasForm meta={metaAEditar} cleanStyle={true} onClose={() => setMetaAEditar(null)} />
                  </Modal>
                )}
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

