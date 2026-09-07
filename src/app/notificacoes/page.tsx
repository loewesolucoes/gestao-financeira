"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useNotification } from "../contexts/notification";
import { useLocation } from "../contexts/location";
import { Loader } from "../components/loader";
import { TipoDeNotificacao } from "../repositories/notificacoes";
import { NotificacaoItem } from "./components/notificacao-item";
import { useStorage } from "../contexts/storage";

function tipoFromParam(value: string | null): TipoDeNotificacao {
  return value === 'mensagem' ? TipoDeNotificacao.MENSAGEM : TipoDeNotificacao.NOTIFICACAO;
}

function paramFromTipo(tipo: TipoDeNotificacao): string {
  return tipo === TipoDeNotificacao.MENSAGEM ? 'mensagem' : 'notificacao';
}

function NotificacoesPage() {
  const { isDbOk, refresh } = useStorage();
  const {
    itens,
    isLoadingItens,
    carregarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    limparLidas,
  } = useNotification();
  const { params, redirectTo } = useLocation();
  const tipoParam = params.get('tipo');
  const [tipo, setTipo] = useState<TipoDeNotificacao>(TipoDeNotificacao.NOTIFICACAO);

  useEffect(() => {
    document.title = `Notificações | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    console.log('useEffect carregarNotificacoes', { isDbOk, tipo });
    isDbOk && carregarNotificacoes(tipo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbOk, tipo]);

  useEffect(() => {
    setTipo(tipoFromParam(tipoParam));
  }, [tipoParam]);

  function trocarTab(novoTipo: TipoDeNotificacao) {
    redirectTo(`/notificacoes?tipo=${paramFromTipo(novoTipo)}`);
  }

  async function handleLimparLidas() {
    if (!window.confirm('Tem certeza que deseja remover permanentemente todos os itens já lidos desta aba?'))
      return;

    await limparLidas();
    await refresh();
  }

  console.log('render NotificacoesPage', { tipo, itens, isLoadingItens });

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
        <button className="btn btn-secondary" disabled={!existeNaoLida} onClick={() => marcarTodasComoLidas(tipo)}>Marcar todas como lidas</button>
        <button className="btn btn-outline-danger" disabled={!existeLida} onClick={handleLimparLidas}>Limpar lidas</button>
      </div>
      {isLoadingItens
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
