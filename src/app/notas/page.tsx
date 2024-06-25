"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { Loader } from "../components/loader";
import { Notas, TableNames, TipoDeNota } from "../utils/db-repository";
import moment from "moment";
import { Modal } from "../components/modal";
import { NotaForm } from "./components/nota-form";
import { EnumUtil } from "../utils/enum";

function NotasPage() {
  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notas, setNotas] = useState<Notas[]>([]);
  const [notaAEditar, setNotaAEditar] = useState<Notas>();

  useEffect(() => {
    document.title = `Notas | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);
    await loadNotas();
    setIsLoading(false);
  }

  async function loadNotas() {
    const result = await repository.list<Notas>(TableNames.NOTAS);

    setNotas(result);
  }


  return (
    <main className="notas container mt-3 d-flex flex-column gap-3">
      <h1>Notas</h1>
      <NotaForm />
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : notas.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhum dado encontrado</div>)
          : (
            <>
              <ul className="list-group">
                {notas.map((x, i) => (
                  <li key={`${x.data}:${x.descricao}:${i}`} className={`list-group-item ${x.descricao == null ? 'list-group-item-warning' : ''} list-group-item-${EnumUtil.keyFromValue(TipoDeNota, x.tipo)}`.toLowerCase()}>
                    <div className="d-flex w-100 justify-content-between gap-3">
                      <div className="d-flex flex-column gap-3">
                        <h5>{x.descricao}</h5>
                        <p>{x.comentario}</p>
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
                <Modal hideFooter={true} onClose={() => setNotaAEditar(null)} title={`Detalhes da transação: ${notaAEditar?.descricao}`}>
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

