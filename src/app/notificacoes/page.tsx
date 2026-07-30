"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { useLocation } from "../contexts/location";
import { Loader } from "../components/loader";
import { Notificacao, TipoDeNotificacao } from "../repositories/notificacoes";
import { NotificacaoItem } from "./components/notificacao-item";

function tipoFromParam(value: string | null): TipoDeNotificacao {
  return value === 'mensagem' ? TipoDeNotificacao.MENSAGEM : TipoDeNotificacao.NOTIFICACAO;
}

function paramFromTipo(tipo: TipoDeNotificacao): string {
  return tipo === TipoDeNotificacao.MENSAGEM ? 'mensagem' : 'notificacao';
}

function NotificacoesPage() {
  const { isDbOk, repository } = useStorage();
  const { params, redirectTo } = useLocation();
  const tipo = tipoFromParam(params.get('tipo'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [itens, setItens] = useState<Notificacao[]>([]);

  useEffect(() => {
    document.title = `Notificações | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbOk, tipo]);

  async function load() {
    setIsLoading(true);

    const result = await repository.notificacoes.listByTipo(tipo);

    setItens(result);
    setIsLoading(false);
  }

  function trocarTab(novoTipo: TipoDeNotificacao) {
    redirectTo(`/notificacoes?tipo=${paramFromTipo(novoTipo)}`);
  }

  async function marcarComoLida(id: number) {
    await repository.notificacoes.marcarComoLida(id);
    await load();
  }

  async function marcarTodasComoLidas() {
    await repository.notificacoes.marcarTodasComoLidas(tipo);
    await load();
  }

  async function limparLidas() {
    if (!window.confirm('Tem certeza que deseja remover permanentemente todos os itens já lidos desta aba?'))
      return;

    await repository.notificacoes.limparLidas();
    await load();
  }

  const tituloAba = tipo === TipoDeNotificacao.MENSAGEM ? 'mensagem' : 'notificação';
  const existeNaoLida = itens.some(x => !x.lida);
  const existeLida = itens.some(x => x.lida);

  return (
    <main className="notificacoes container mt-3 d-flex flex-column gap-3">
      <h1>Notificações e Mensagens</h1>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tipo === TipoDeNotificacao.NOTIFICACAO ? 'active' : ''}`}
            onClick={() => trocarTab(TipoDeNotificacao.NOTIFICACAO)}
          >
            Notificações
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${tipo === TipoDeNotificacao.MENSAGEM ? 'active' : ''}`}
            onClick={() => trocarTab(TipoDeNotificacao.MENSAGEM)}
          >
            Mensagens
          </button>
        </li>
      </ul>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-secondary" disabled={!existeNaoLida} onClick={marcarTodasComoLidas}>Marcar todas como lidas</button>
        <button className="btn btn-outline-danger" disabled={!existeLida} onClick={limparLidas}>Limpar lidas</button>
      </div>
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : itens.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhuma {tituloAba} encontrada.</div>)
          : (
            <ul className="list-group list-group-material-1">
              {itens.map(x => (
                <NotificacaoItem key={x.id} item={x} onMarcarComoLida={() => marcarComoLida(x.id)} />
              ))}
            </ul>
          )}
    </main>
  );
}

export default function Page() {
  return (
    <Layout>
      <NotificacoesPage />
    </Layout>
  );
}
