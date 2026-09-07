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
  const { isDbOk, repository } = useStorage();

  // Refs para o listener do BroadcastChannel e para as funções de acesso ao repositório
  // sempre enxergarem o repository/isDbOk mais recentes, sem precisar recriar o canal a
  // cada mudança de estado. tipoAtualRef guarda o tipo atualmente carregado em `itens`,
  // pra recarregar a mesma lista depois de uma mutação sem quem chamou precisar informar de novo.
  const isDbOkRef = useRef(isDbOk);
  const repositoryRef = useRef(repository);
  const tipoAtualRef = useRef<TipoDeNotificacao | null>(null);

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

    const tipo = payload.tipo ?? TipoDeNotificacao.NOTIFICACAO;

    try {
      await repositoryRef.current.notificacoes.save(TableNames.NOTIFICACOES, {
        tipo,
        titulo: payload.titulo,
        descricao: payload.message,
        lida: false,
        data: new Date(),
      });

      await refreshContadores();

      // Se a aba de notificações estiver aberta no mesmo tipo recebido, atualiza a lista na hora.
      if (tipoAtualRef.current === tipo)
        await recarregarItens();
    } catch (ex) {
      console.error('erro ao persistir notificação recebida:', ex);
    }
  }

  // Recarrega `itens` com o tipo atualmente exibido (guardado em tipoAtualRef), usado após
  // qualquer mutação (marcar como lida, limpar lidas etc.) pra manter a lista compartilhada em dia.
  async function recarregarItens() {
    if (!isDbOkRef.current || !repositoryRef.current?.notificacoes || tipoAtualRef.current === null)
      return;

    const result = await repositoryRef.current.notificacoes.listByTipo(tipoAtualRef.current);

    setItens(result);
  }

  async function carregarNotificacoes(tipo: TipoDeNotificacao) {
    tipoAtualRef.current = tipo;

    if (!isDbOkRef.current || !repositoryRef.current?.notificacoes)
      return;

    setIsLoadingItens(true);

    try {
      const result = await repositoryRef.current.notificacoes.listByTipo(tipo);

      setItens(result);
    } finally {
      setIsLoadingItens(false);
    }
  }

  async function marcarComoLida(id: number) {
    if (!repositoryRef.current?.notificacoes)
      return;

    await repositoryRef.current.notificacoes.marcarComoLida(id);
    await recarregarItens();
    await refreshContadores();
  }

  async function marcarTodasComoLidas(tipo: TipoDeNotificacao) {
    if (!repositoryRef.current?.notificacoes)
      return;

    await repositoryRef.current.notificacoes.marcarTodasComoLidas(tipo);
    await recarregarItens();
    await refreshContadores();
  }

  async function limparLidas(diasRetencao?: number) {
    if (!repositoryRef.current?.notificacoes)
      return;

    await repositoryRef.current.notificacoes.limparLidas(diasRetencao);
    await recarregarItens();
    await refreshContadores();
  }

  return (
    <NotificationContext.Provider
      value={{
        isDbOk,
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