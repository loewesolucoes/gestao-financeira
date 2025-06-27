"use client";

import { useEffect, useState } from "react";
import { AuthButton } from "../components/auth-button";
import { Layout } from "../shared/layout";
import "./page.scss";
import { Loader } from "../components/loader";
import { useStorage } from "../contexts/storage";
import { useEnv } from "../contexts/env";
import { Parametro } from "../repositories/parametros";
import { Input } from "../components/input";
import { NotificationUtil } from "../utils/notification";

function Configuracoes() {
  const [isLoading, setIsLoading] = useState(false);
  const { isDbOk, exportOriginalDumpToFileAndDownload, importOriginalDumpFromFile, repository, refresh } = useStorage();
  const { aplicationName } = useEnv()
  const [file, setFile] = useState<File>()
  const [params, setParams] = useState<Parametro[]>([])
  const [currentParam, setCurrentParam] = useState<Parametro>()

  useEffect(() => {
    document.title = `Configurações | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    if (isDbOk) {
      loadParams();
    }
  }, [isDbOk]);

  async function loadParams() {
    setIsLoading(true);

    const paramsDict = await repository.params.getDict();

    setParams(Object.values(paramsDict));
    setIsLoading(false);
  }

  function handleChange(event: any) {
    setFile(event.target.files[0])
  }

  async function exportToDb() {
    setIsLoading(true);

    await exportOriginalDumpToFileAndDownload(`${aplicationName}.db`);

    setIsLoading(false);
  }

  async function importFromDb() {
    setIsLoading(true);

    await importOriginalDumpFromFile(file);

    NotificationUtil.send('arquivo carregado com sucesso');
    setIsLoading(false);
  }

  async function saveParam(currentParam?: Parametro) {
    if (currentParam == null)
      return NotificationUtil.send('Parâmetro invalido.');

    setIsLoading(true);
    await repository.params.set(currentParam.chave, currentParam.valor);
    setCurrentParam(undefined);

    await refresh();
    setIsLoading(false);
  }

  const isAllLoading = isLoading || !isDbOk

  return (
    <main className="main container my-3">
      <h1>Configurações da aplicação</h1>
      <article className={`configs ${isAllLoading && 'is-loading'}`}>
        {isAllLoading
          ? <Loader />
          : (
            <>
              <section className="card">
                <h5 className="card-header">Carregar dados de um arquivo</h5>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="formFile" className="form-label">Escolha um arquivo do tipo .db</label>
                    <input className="form-control" type="file" id="formFile" accept=".db,.sqlite" onChange={handleChange} />
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={importFromDb}>Clique para carregar dados de um arquivo</button>
                </div>
              </section>
              <section className="card">
                <h5 className="card-header">Exportar dados para um arquivo</h5>
                <div className="card-body">
                  <button type="button" className="btn btn-secondary" onClick={exportToDb}>Clique para exportar dados para um arquivo</button>
                </div>
              </section>
              <section className="card gdrive">
                <h5 className="card-header">Google drive</h5>
                <div className="card-body">
                  <AuthButton />
                </div>
              </section>
              <section className="card">
                <h5 className="card-header">Parâmetros</h5>
                <div className="card-body d-flex flex-column gap-3">
                  <div className="flex-grow-1">
                    <label htmlFor="chave" className="form-label">Nome chave: </label>
                    <select className={`form-select`} id="chave" onChange={e => setCurrentParam(params[e.target.value])}>
                      <option>Escolha um parâmetro</option>
                      {params.map((x, i) => (
                        <option key={x.chave} value={i}>{x.chave}</option>
                      ))}
                    </select>
                  </div>
                  {currentParam && (
                    <>
                      <div className="flex-grow-1">
                        <label htmlFor="valor" className="form-label">Valor: </label>
                        <Input type="text" className="form-control" id="valor" onChange={x => setCurrentParam({ ...currentParam, valor: x } as any)} value={currentParam?.valor} placeholder="Descrição" />
                      </div>
                      <button type="button" className="btn btn-secondary w-100" onClick={e => saveParam(currentParam)}>Salvar</button>
                    </>
                  )}
                </div>
              </section>
            </>
          )}
      </article>
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <Configuracoes />
    </Layout>
  );
}

