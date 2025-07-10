"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { Loader } from "../components/loader";
import { Notas, TipoDeNota } from "../repositories/notas";
import moment from "moment";
import { Modal } from "../components/modal";
import { NotaForm } from "./components/nota-form";
import { EnumUtil } from "../utils/enum";
import { MarkdownUtils } from "../utils/markdown";
import { TableNames } from "../repositories/default";

function NotasPage() {
  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notas, setNotas] = useState<Notas[]>([]);
  const [notaAEditar, setNotaAEditar] = useState<Notas>();
  const [parsedNotas, setParsedNotas] = useState<Notas[]>([]);

  useEffect(() => {
    document.title = `Notas | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  useEffect(() => {
    setParsedNotas(notas.map(x => ({
      ...x,
      __parsedComentario: MarkdownUtils.render(x.comentario),
    })));
  }, [notas]);

  async function load() {
    setIsLoading(true);
    await loadNotas();
    setIsLoading(false);
  }

  async function loadNotas() {
    const result = await repository.notas.list<Notas>(TableNames.NOTAS);

    setNotas(result);
  }

  return (
    <main className="notas container mt-3 d-flex flex-column gap-3">
      <h1>Notas</h1>
      <NotaForm />
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : notas.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhuma nota encontrada. Adicione uma nova nota para começar a utilizar o sistema.</div>)
          : (
            <>
              <ul className="list-group list-group-material-1">
                {parsedNotas.map((x, i) => (
                  <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao == null ? 'list-group-item-warning' : ''} list-group-item-${EnumUtil.keyFromValue(TipoDeNota, x.tipo)}`.toLowerCase()}>
                    <div className="d-flex w-100 justify-content-between gap-3">
                      <div className="d-flex flex-column gap-3">
                        <h5>{x.descricao}</h5>
                        <p dangerouslySetInnerHTML={{ __html: (x as any).__parsedComentario }} />
                      </div>
                      <div className="d-flex flex-column gap-3">
                        <small>{moment(x.data).format('DD/MM/YY')}</small>
                        <button className="btn btn-secondary" onClick={e => setNotaAEditar(x)}>Editar</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {notaAEditar && (
                <Modal hideFooter={true} onClose={() => setNotaAEditar(null)} title={`Detalhes da nota: ${notaAEditar?.descricao}`}>
                  <NotaForm nota={notaAEditar} cleanStyle={true} onClose={() => setNotaAEditar(null)} />
                </Modal>
              )}
            </>
          )
      }
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <NotasPage />
    </Layout>
  );
}

