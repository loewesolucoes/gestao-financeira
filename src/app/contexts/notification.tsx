"use client";

import React, { createContext, useEffect, useRef, useState } from "react"
import { NotificationBroadcastPayload, NotificationUtil } from "../utils/notification";
import { useStorage } from "./storage";
import { TableNames } from "../repositories/default";
import { TipoDeNotificacao } from "../repositories/notificacoes";

interface NotificationMessage {
  message: string
}

interface NotificationProviderContext {
  notifications: NotificationMessage[]
  naoLidasNotificacoes: number
  naoLidasMensagens: number
  refreshContadores: () => Promise<void>
}

const NotificationContext = createContext<NotificationProviderContext>({
  notifications: [],
  naoLidasNotificacoes: 0,
  naoLidasMensagens: 0,
  refreshContadores: () => Promise.resolve(),
});

// Dias de retenção para itens já lidos, purgados automaticamente a cada start/refresh do banco.
const DIAS_RETENCAO_LIDAS = 30;

export function NotificationProvider(props: any) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [naoLidasNotificacoes, setNaoLidasNotificacoes] = useState<number>(0);
  const [naoLidasMensagens, setNaoLidasMensagens] = useState<number>(0);
  const { isDbOk, repository } = useStorage();

  // Refs para o listener do BroadcastChannel sempre enxergar o repository/isDbOk mais recentes,
  // sem precisar recriar o canal a cada mudança de estado.
  const isDbOkRef = useRef(isDbOk);
  const repositoryRef = useRef(repository);

  useEffect(() => {
    isDbOkRef.current = isDbOk;
    repositoryRef.current = repository;
  }, [isDbOk, repository]);

  useEffect(() => {
    const broadcast = new BroadcastChannel(NotificationUtil.NOTIFICATION_BROADCAST_CHANNEL_KEY);

    broadcast.onmessage = (event) => {
      const payload = event.data as NotificationBroadcastPayload;

      setNotifications(n => [...n, payload]);
      persistirNotificacaoRecebida(payload);
    }

    return () => broadcast.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!isDbOkRef.current || !repositoryRef.current?.notificacoes)
      return;

    const [notificacoes, mensagens] = await Promise.all([
      repositoryRef.current.notificacoes.countUnread(TipoDeNotificacao.NOTIFICACAO),
      repositoryRef.current.notificacoes.countUnread(TipoDeNotificacao.MENSAGEM),
    ]);

    setNaoLidasNotificacoes(notificacoes);
    setNaoLidasMensagens(mensagens);
  }

  async function persistirNotificacaoRecebida(payload: NotificationBroadcastPayload) {
    if (!isDbOkRef.current || !repositoryRef.current?.notificacoes) {
      console.warn('banco ainda não está pronto, notificação recebida não será persistida:', payload);
      return;
    }

    try {
      await repositoryRef.current.notificacoes.save(TableNames.NOTIFICACOES, {
        tipo: payload.tipo ?? TipoDeNotificacao.NOTIFICACAO,
        titulo: payload.titulo,
        descricao: payload.message,
        lida: false,
        data: new Date(),
      });

      await refreshContadores();
    } catch (ex) {
      console.error('erro ao persistir notificação recebida:', ex);
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        naoLidasNotificacoes,
        naoLidasMensagens,
        refreshContadores,
      }}
      {...props}
    />
  )
}

export const useNotification = () => React.useContext(NotificationContext)