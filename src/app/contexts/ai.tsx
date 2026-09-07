"use client";

// Extend the Window interface to include __google (same technique as ai-translate, avoids
// re-creating the Google Generative AI client on every render).
declare global {
  interface Window {
    __google: any;
  }
}

import React, { createContext, useEffect, useState } from "react"
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { useStorage } from "./storage";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../repositories/parametros";
import { NotificationUtil } from "../utils/notification";
import systemPrompt from "../prompts/relatorios-chat.md";

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Caps sequential tool-call round-trips (model -> consultarBancoDados -> model -> ...) to bound
// latency/cost and avoid runaway loops.
const MAX_STEPS = 6;

const AiContext = createContext({
  isReady: false,
  askRelatoriosChat: async (messages: ChatMessage[]): Promise<string | undefined> => {
    console.warn("askRelatoriosChat not implemented");
    return undefined;
  },
});

export function AiProvider(props: any) {
  const { repository, isDbOk } = useStorage();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    const apiKey = await repository.params.getValorByKey(GOOGLE_GENERATIVE_AI_API_KEY);

    if (!apiKey?.trim()) {
      setIsReady(false);
      return;
    }

    if (window.__google == null) {
      window.__google = createGoogleGenerativeAI({ apiKey });
    }

    setIsReady(true);
  }

  async function askRelatoriosChat(messages: ChatMessage[]): Promise<string | undefined> {
    const google = window.__google;

    if (google == null || !isReady) {
      NotificationUtil.send(`Chave da API do Google Generative AI não configurada. Configure em Configurações > Parâmetros (${GOOGLE_GENERATIVE_AI_API_KEY}).`);
      return undefined;
    }

    try {
      const { text } = await generateText({
        model: google('gemini-3.5-flash-lite'),
        system: systemPrompt,
        messages,
        maxSteps: MAX_STEPS,
        tools: {
          consultarBancoDados: tool({
            description: 'Executa uma consulta SQL somente leitura (SELECT/WITH) contra o banco de dados financeiro local do usuário e retorna as linhas do resultado. Use sempre que precisar de números ou fatos reais para responder.',
            parameters: z.object({
              sql: z.string().describe('A consulta SQL SELECT/WITH a ser executada.'),
            }),
            execute: async ({ sql }) => repository.runReadOnlyQuery(sql),
          }),
        },
      });

      return text;
    } catch (error: any) {
      console.error('askRelatoriosChat error:', error);
      NotificationUtil.send('Erro ao consultar o assistente de IA. Verifique sua chave de API, conexão ou cota e tente novamente.');
      return undefined;
    }
  }

  return (
    <AiContext.Provider
      value={{
        isReady,
        askRelatoriosChat,
      }}
      {...props}
    />
  )
}

export const useAi = () => React.useContext(AiContext)
