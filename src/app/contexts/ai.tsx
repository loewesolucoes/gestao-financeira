"use client";

// Extend the Window interface to include __google (same technique as ai-translate, avoids
// re-creating the Google Generative AI client on every render).
declare global {
  interface Window {
    __google: any;
  }
}

import React, { createContext, useEffect, useState } from "react"
import { useStorage } from "./storage";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../repositories/parametros";
import { NotificationUtil } from "../utils/notification";
import systemPrompt from "../prompts/relatorios-chat.md";

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiModelOption {
  id: string
  label: string
}

// Caps sequential tool-call round-trips (model -> consultarBancoDados -> model -> ...) to bound
// latency/cost and avoid runaway loops.
const MAX_STEPS = 6;

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

// Used both as the initial select options (before listAvailableModels() resolves) and as the
// fallback when the Google API model-listing request fails.
export const FALLBACK_MODELS: AiModelOption[] = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro' },
];

// Only the standard chat-oriented tiers the user cares about: pro, flash and flash-lite.
// Excludes other generateContent-capable gemini variants (live, tts, image-generation,
// computer-use, robotics, thinking/preview experiments, etc.) that don't fit this chat UI.
const CHAT_MODEL_NAME_KEYWORDS = ['pro', 'flash', 'lite'];

const AiContext = createContext({
  isReady: false,
  askRelatoriosChat: async (messages: ChatMessage[], model?: string): Promise<string | undefined> => {
    console.warn("askRelatoriosChat not implemented");
    return undefined;
  },
  listAvailableModels: async (): Promise<AiModelOption[]> => {
    console.warn("listAvailableModels not implemented");
    return FALLBACK_MODELS;
  },
});

export function AiProvider(props: any) {
  const { repository, isDbOk } = useStorage();
  const [isReady, setIsReady] = useState(false);
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  // Only checks whether an API key is configured. Does NOT create the Google client or import
  // any AI library here: this effect runs on every page (AiProvider wraps the whole app), so
  // pulling in @ai-sdk/google/ai/zod here would load them globally again. Those heavy libs are
  // dynamically imported only inside askRelatoriosChat/getGoogleClient, i.e. when the chat is
  // actually used.
  async function load() {
    const key = await repository.params.getValorByKey(GOOGLE_GENERATIVE_AI_API_KEY);
    const trimmedKey = key?.trim() || undefined;

    setApiKey(trimmedKey);
    setIsReady(!!trimmedKey);
  }

  async function getGoogleClient(key: string) {
    if (window.__google == null) {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google');

      window.__google = createGoogleGenerativeAI({ apiKey: key });
    }

    return window.__google;
  }

  // Lists the models actually available for this API key via the Generative Language REST API
  // (no SDK needed for this, just fetch), filtered to gemini-* models that support generateContent
  // and match one of the standard chat tiers (pro/flash/lite). Falls back to a fixed list on any
  // failure (network, CORS, invalid key, unexpected shape).
  async function listAvailableModels(): Promise<AiModelOption[]> {
    if (!apiKey) return FALLBACK_MODELS;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (!response.ok) return FALLBACK_MODELS;

      const data = await response.json();
      const models: AiModelOption[] = (data?.models || [])
        .filter((m: any) => {
          if (typeof m?.name !== 'string' || !m.name.includes('gemini')) return false;
          if (!Array.isArray(m.supportedGenerationMethods) || !m.supportedGenerationMethods.includes('generateContent')) return false;

          const nameLower = m.name.toLowerCase();

          return CHAT_MODEL_NAME_KEYWORDS.some(keyword => nameLower.includes(keyword));
        })
        .map((m: any) => ({ id: (m.name as string).replace(/^models\//, ''), label: m.displayName || m.name }));

      return models.length > 0 ? models : FALLBACK_MODELS;
    } catch (error) {
      console.error('listAvailableModels error:', error);
      return FALLBACK_MODELS;
    }
  }

  async function askRelatoriosChat(messages: ChatMessage[], model: string = DEFAULT_MODEL): Promise<string | undefined> {
    if (!apiKey || !isReady) {
      NotificationUtil.send(`Chave da API do Google Generative AI não configurada. Configure em Configurações > Parâmetros (${GOOGLE_GENERATIVE_AI_API_KEY}).`);
      return undefined;
    }

    try {
      const google = await getGoogleClient(apiKey);
      const { generateText, stepCountIs, tool } = await import('ai');
      const { z } = await import('zod');

      const { text } = await generateText({
        model: google(model),
        system: systemPrompt,
        messages,
        stopWhen: stepCountIs(MAX_STEPS),
        tools: {
          consultarBancoDados: tool({
            description: 'Executa uma consulta SQL somente leitura (SELECT/WITH) contra o banco de dados financeiro local do usuário e retorna as linhas do resultado. Use sempre que precisar de números ou fatos reais para responder.',
            inputSchema: z.object({
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
        listAvailableModels,
      }}
      {...props}
    />
  )
}

export const useAi = () => React.useContext(AiContext)
