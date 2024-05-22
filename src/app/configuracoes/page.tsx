"use client";

import { useEffect, useState } from "react";
import { AuthButton } from "../components/auth-button";
import { Layout } from "../shared/layout";
import "./page.scss";
import { Loader } from "../components/loader";
import { useStorage } from "../contexts/storage";
import { useEnv } from "../contexts/env";

function Configuracoes() {
  const [isLoading, setIsLoading] = useState(false);
  const { isDbOk, exportOriginalDumpToFileAndDownload, importOriginalDumpFromFile } = useStorage();
  const { aplicationName } = useEnv()
  const [file, setFile] = useState<File>()

  useEffect(() => {
    document.title = `Configurações | ${document.title}`
  }, []);

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

    alert('arquivo carregado com sucesso');
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

