"use client";

import React, { createContext, useEffect, useRef, useState } from "react"
import { NotificationBroadcastPayload, NotificationUtil } from "../utils/notification";
import { useStorage } from "./storage";
import { TableNames } from "../repositories/default";
import { Notificacao, TipoDeNotificacao } from "../repositories/notificacoes";

interface NotificationMessage {
  message: string
}

interface NotificationProviderContext {
  isDbOk: boolean
  notifications: NotificationMessage[]
  naoLidasNotificacoes: number
  naoLidasMensagens: number
  itens: Notificacao[]
  isLoadingItens: boolean
  refreshContadores: () => Promise<void>
  carregarNotificacoes: (tipo: TipoDeNotificacao) => Promise<void>
  marcarComoLida: (id: number) => Promise<void>
  marcarTodasComoLidas: (tipo: TipoDeNotificacao) => Promise<void>
  limparLidas: (diasRetencao?: number) => Promise<void>
}

const NotificationContext = createContext<NotificationProviderContext>({
  isDbOk: false,
  notifications: [],
  naoLidasNotificacoes: 0,
  naoLidasMensagens: 0,
  itens: [],
  isLoadingItens: false,
  refreshContadores: () => Promise.resolve(),
  carregarNotificacoes: () => Promise.resolve(),
  marcarComoLida: () => Promise.resolve(),
  marcarTodasComoLidas: () => Promise.resolve(),
  limparLidas: () => Promise.resolve(),
});

// Dias de retenção para itens já lidos, purgados automaticamente a cada start/refresh do banco.
const DIAS_RETENCAO_LIDAS = 30;

export function NotificationProvider(props: any) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [naoLidasNotificacoes, setNaoLidasNotificacoes] = useState<number>(0);
  const [naoLidasMensagens, setNaoLidasMensagens] = useState<number>(0);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [isLoadingItens, setIsLoadingItens] = useState<boolean>(false);
  const { isDbOk, repository, refresh } = useStorage();

  useEffect(() => {
    const broadcast = new BroadcastChannel(NotificationUtil.NOTIFICATION_BROADCAST_CHANNEL_KEY);

    broadcast.onmessage = (event) => {
      const payload = event.data as NotificationBroadcastPayload;

      setNotifications(n => [...n, payload]);
      persistirNotificacaoRecebida(payload);
    }

    return () => broadcast.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbOk]);

  useEffect(() => {
    isDbOk && carregarDoBanco();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDbOk]);

  // Roda no start do app e em todo refresh() do storage (que alterna isDbOk false -> true):
  // purga notificações lidas antigas e recarrega os contadores de não lidas do banco.
  async function carregarDoBanco() {
    try {
      await repository.notificacoes.limparLidas(DIAS_RETENCAO_LIDAS);
    } catch (ex) {
      console.error('erro ao limpar notificações lidas antigas:', ex);
    }

    await refreshContadores();
  }

  async function refreshContadores() {
    if (!isDbOk || !repository?.notificacoes) {
      console.warn('banco ainda não está pronto');
      return;
    }

    const [notificacoes, mensagens] = await Promise.all([
      repository.notificacoes.countUnread(TipoDeNotificacao.NOTIFICACAO),
      repository.notificacoes.countUnread(TipoDeNotificacao.MENSAGEM),
    ]);

    setNaoLidasNotificacoes(notificacoes);
    setNaoLidasMensagens(mensagens);
  }

  async function persistirNotificacaoRecebida(payload: NotificationBroadcastPayload) {
    if (!isDbOk || !repository?.notificacoes) {
      console.warn('banco ainda não está pronto, notificação recebida não será persistida:', payload);
      return;
    }

    const tipo = payload.tipo ?? TipoDeNotificacao.NOTIFICACAO;

    try {
      await repository.notificacoes.save(TableNames.NOTIFICACOES, {
        tipo,
        titulo: payload.titulo,
        descricao: payload.message,
        lida: false,
        data: new Date(),
      });

      await refreshContadores();
      await refresh();
    } catch (ex) {
      console.error('erro ao persistir notificação recebida:', ex);
    }
  }

  async function carregarNotificacoes(tipo: TipoDeNotificacao) {
    if (!isDbOk || !repository?.notificacoes)
      return;

    setIsLoadingItens(true);

    try {
      const result = await repository.notificacoes.listByTipo(tipo);

      setItens(result);
    } finally {
      setIsLoadingItens(false);
    }
  }

  async function marcarComoLida(id: number) {
    if (!repository?.notificacoes)
      return;

    await repository.notificacoes.marcarComoLida(id);
    await refreshContadores();
    await refresh();
  }

  async function marcarTodasComoLidas(tipo: TipoDeNotificacao) {
    if (!repository?.notificacoes)
      return;

    await repository.notificacoes.marcarTodasComoLidas(tipo);
    await refreshContadores();
  }

  async function limparLidas(diasRetencao?: number) {
    if (!repository?.notificacoes)
      return;

    await repository.notificacoes.limparLidas(diasRetencao);
    await refreshContadores();
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        naoLidasNotificacoes,
        naoLidasMensagens,
        itens,
        isLoadingItens,
        refreshContadores,
        carregarNotificacoes,
        marcarComoLida,
        marcarTodasComoLidas,
        limparLidas,
      }}
      {...props}
    />
  )
}

export const useNotification = () => React.useContext(NotificationContext)