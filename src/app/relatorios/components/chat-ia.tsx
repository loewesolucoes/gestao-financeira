"use client";

import { useEffect, useRef, useState } from "react";
import { useStorage } from "../../contexts/storage";
import { useAi, ChatMessage } from "../../contexts/ai";
import { GOOGLE_GENERATIVE_AI_API_KEY } from "../../repositories/parametros";
import { Loader } from "../../components/loader";
import { Input } from "../../components/input";
import { MarkdownUtils } from "../../utils/markdown";

export function ChatIa() {
  const { isDbOk, repository } = useStorage();
  const { askRelatoriosChat } = useAi();
  const [hasApiKey, setHasApiKey] = useState<boolean | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isDbOk && loadApiKeyStatus();
  }, [isDbOk]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  async function loadApiKeyStatus() {
    const apiKey = await repository.params.getValorByKey(GOOGLE_GENERATIVE_AI_API_KEY);

    setHasApiKey(!!apiKey?.trim());
  }

  async function handleSend() {
    const content = input.trim();

    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    const answer = await askRelatoriosChat(nextMessages);

    if (answer) {
      setMessages([...nextMessages, { role: "assistant", content: answer }]);
    }

    setIsLoading(false);
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
      <div className="chat-ia-messages flex-grow-1 mb-3">
        {messages.length === 0 && (
          <p className="text-muted">Pergunte algo sobre suas finanças, por exemplo: &quot;quanto gastei em restaurantes este mês?&quot;.</p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={`chat-ia-bubble chat-ia-bubble-${message.role}`}>
            {message.role === "assistant"
              ? <div dangerouslySetInnerHTML={{ __html: MarkdownUtils.render(message.content) }} />
              : message.content}
          </div>
        ))}
        {isLoading && <Loader />}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-ia-input d-flex flex-column gap-2">
        <div className="chat-ia-mdtextarea flex-grow-1">
          <Input
            type="mdtextarea"
            className="form-control"
            id="chat-ia-pergunta"
            placeholder="Escreva sua pergunta em markdown e clique em Enviar"
            value={input}
            onChange={setInput}
          />
        </div>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-secondary flex-grow-1" disabled={isLoading || !input.trim()} onClick={handleSend}>
            Enviar
          </button>
          <button type="button" className="btn btn-outline-secondary" disabled={isLoading || messages.length === 0} onClick={handleClear}>
            Limpar conversa
          </button>
        </div>
      </div>
    </div>
  );
}
