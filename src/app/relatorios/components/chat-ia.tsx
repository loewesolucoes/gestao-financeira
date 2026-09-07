"use client";

import { useEffect, useRef, useState } from "react";
import { useStorage } from "../../contexts/storage";
import { useAi, ChatMessage, AiModelOption, DEFAULT_MODEL, FALLBACK_MODELS } from "../../contexts/ai";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../../repositories/parametros";
import { Loader } from "../../components/loader";
import { Input } from "../../components/input";
import { MarkdownUtils } from "../../utils/markdown";

// Rotated while waiting for the assistant's answer, mixing playful and descriptive phrases
// (similar to Claude Code) since answers can take a few seconds (tool calls to the DB, etc.).
const LOADING_MESSAGES = [
  "Consultando suas transações...",
  "Remoendo os números...",
  "Cruzando gastos com suas notas...",
  "Analisando categorias...",
  "Fazendo as contas...",
  "Garimpando dados no banco local...",
  "Pensando com carinho no seu bolso...",
  "Quase lá...",
];

const LOADING_MESSAGE_INTERVAL_MS = 2000;

// Clicking one of these only fills the input so the user can review/edit before sending.
const EXAMPLE_QUESTIONS = [
  "Quanto gastei este mês?",
  "Quais foram minhas maiores categorias de gasto?",
  "Como está o progresso das minhas metas financeiras?",
  "Meu patrimônio cresceu nos últimos meses?",
  "Tenho empréstimos em aberto?",
];

export function ChatIa() {
  const { isDbOk, repository } = useStorage();
  const { askRelatoriosChat, listAvailableModels } = useAi();
  const [hasApiKey, setHasApiKey] = useState<boolean | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [models, setModels] = useState<AiModelOption[]>(FALLBACK_MODELS);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isDbOk && loadApiKeyStatus();
  }, [isDbOk]);

  useEffect(() => {
    hasApiKey && loadAvailableModels();
  }, [hasApiKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex(index => (index + 1) % LOADING_MESSAGES.length);
    }, LOADING_MESSAGE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isLoading]);

  async function loadApiKeyStatus() {
    const apiKey = await repository.params.getValorByKey(GOOGLE_GENERATIVE_AI_API_KEY);

    setHasApiKey(!!apiKey?.trim());
  }

  async function loadAvailableModels() {
    const availableModels = await listAvailableModels();

    setModels(availableModels);
  }

  async function sendMessage(content: string) {
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const answer = await askRelatoriosChat(nextMessages, selectedModel);

    if (answer) {
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
    }

    setIsLoading(false);
  }

  async function handleSend() {
    await sendMessage(input.trim());
  }

  function handleExampleClick(question: string) {
    setInput(question);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSend();
  }

  function handleClear() {
    setMessages([]);
    setInput("");
  }

  if (hasApiKey === undefined) {
    return <Loader />;
  }

  if (!hasApiKey) {
    return (
      <div className="chat-ia-notice alert alert-info mb-0">
        Para usar o chat de IA, configure sua chave <code>{GOOGLE_GENERATIVE_AI_API_KEY}</code> em{" "}
        <a href={`${process.env.BASE_PATH ?? ""}/configuracoes`}>Configurações &gt; Parâmetros</a>.
      </div>
    );
  }

  return (
    <div className="chat-ia d-flex flex-column">
      <div className="chat-ia-toolbar d-flex justify-content-end align-items-center gap-2 mb-2">
        <label htmlFor="chat-ia-modelo" className="form-label mb-0 text-muted small">Modelo</label>
        <select
          id="chat-ia-modelo"
          className="form-select form-select-sm chat-ia-model-select"
          value={selectedModel}
          onChange={event => setSelectedModel(event.target.value)}
          disabled={isLoading}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>{model.label}</option>
          ))}
        </select>
      </div>
      <div className="chat-ia-messages flex-grow-1 mb-3">
        {messages.length === 0 && (
          <div className="chat-ia-empty">
            <p className="text-muted">Pergunte algo sobre suas finanças, por exemplo: &quot;quanto gastei em restaurantes este mês?&quot;.</p>
            <div className="chat-ia-suggestions d-flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map(question => (
                <button
                  key={question}
                  type="button"
                  className="btn btn-sm btn-outline-secondary chat-ia-suggestion-btn"
                  onClick={() => handleExampleClick(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`chat-ia-bubble chat-ia-bubble-${message.role}`}>
            {message.role === "assistant"
              ? <div dangerouslySetInnerHTML={{ __html: MarkdownUtils.render(message.content) }} />
              : message.content}
          </div>
        ))}
        {isLoading && (
          <div className="chat-ia-loading d-flex align-items-center gap-2">
            <Loader />
            <span className="chat-ia-loading-text text-muted">{LOADING_MESSAGES[loadingMessageIndex]}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-ia-input d-flex flex-column gap-2" onSubmit={handleSubmit}>
        <div className="chat-ia-mdtextarea flex-grow-1">
          <Input
            type="mdtextarea"
            className="form-control"
            id="chat-ia-pergunta"
            placeholder="Escreva sua pergunta em markdown (Ctrl+Enter para enviar)"
            value={input}
            onChange={setInput}
          />
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-secondary flex-grow-1" disabled={isLoading || !input.trim()}>
            Enviar
          </button>
          <button type="button" className="btn btn-outline-secondary" disabled={isLoading || messages.length === 0} onClick={handleClear}>
            Limpar conversa
          </button>
        </div>
      </form>
    </div>
  );
}
