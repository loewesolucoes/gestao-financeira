"use client";

import moment from "moment";
import { useEffect, useState } from "react";
import { MarkdownUtils } from "../../utils/markdown";
import { Notificacao } from "../../repositories/notificacoes";

interface NotificacaoItemProps {
  item: Notificacao
  onMarcarComoLida: () => void
}

export function NotificacaoItem({ item, onMarcarComoLida }: NotificacaoItemProps) {
  const [parsedDescricao, setParsedDescricao] = useState<string>('');

  useEffect(() => {
    setParsedDescricao(MarkdownUtils.render(item.descricao));
  }, [item]);

  function handleClick() {
    if (!item.lida) {
      onMarcarComoLida();
    }
  }

  return (
    <li
      className={`list-group-item ${item.lida ? 'list-group-item-light' : 'list-group-item-info fw-bold'}`}
      role={!item.lida ? 'button' : undefined}
      onClick={handleClick}
    >
      <div className="d-flex w-100 justify-content-between gap-3">
        <div className="d-flex flex-column gap-2">
          <h5>{item.titulo}</h5>
          <p className="fw-normal mb-0" dangerouslySetInnerHTML={{ __html: parsedDescricao }} />
        </div>
        <small className="text-nowrap">{moment(item.data).format('DD/MM/YYYY HH:mm')}</small>
      </div>
    </li>
  );
}
