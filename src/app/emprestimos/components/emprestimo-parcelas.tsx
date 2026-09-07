"use client";

import { useState } from "react";
import moment from "moment";
import { Input } from "@/app/components/input";
import { useStorage } from "@/app/contexts/storage";
import { EmprestimoParcelas } from "@/app/repositories/emprestimos";
import { NumberUtil } from "@/app/utils/number";
import { MarkdownUtils } from "@/app/utils/markdown";

interface CustomProps {
  parcelas: EmprestimoParcelas[]
  onChanged?: () => void
}

export function EmprestimoParcelasList({ parcelas, onChanged }: CustomProps) {
  const { repository, refresh } = useStorage();
  const [parcelaEmEdicaoId, setParcelaEmEdicaoId] = useState<number>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function onTogglePago(parcela: EmprestimoParcelas) {
    setIsLoading(true);

    await repository.emprestimos.marcarParcelaPaga(parcela.id, !parcela.pago);
    await refresh();

    onChanged && onChanged();
    setIsLoading(false);
  }

  async function onSalvarEdicao(parcela: EmprestimoParcelas, valor: any, dataVencimento: Date, comentario?: string) {
    setIsLoading(true);

    await repository.emprestimos.editarParcela(parcela.id, { valor, dataVencimento, comentario });
    await refresh();

    onChanged && onChanged();
    setParcelaEmEdicaoId(undefined);
    setIsLoading(false);
  }

  const parcelasOrdenadas = [...(parcelas || [])].sort((a, b) => a.numero - b.numero);

  if (parcelasOrdenadas.length === 0)
    return <div className="alert alert-info my-2" role="alert">Nenhuma parcela cadastrada.</div>;

  return (
    <ul className="list-group emprestimo-parcelas">
      {parcelasOrdenadas.map(parcela => (
        <li key={parcela.id} className={`list-group-item d-flex flex-column gap-2 ${parcela.pago ? 'list-group-item-success' : ''}`}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`parcela-pago-${parcela.id}`}
                checked={!!parcela.pago}
                disabled={isLoading}
                onChange={() => onTogglePago(parcela)}
              />
              <label className="form-check-label" htmlFor={`parcela-pago-${parcela.id}`}>Parcela {parcela.numero}</label>
            </div>
            {parcelaEmEdicaoId === parcela.id
              ? (
                <EdicaoParcela
                  parcela={parcela}
                  isLoading={isLoading}
                  onSalvar={onSalvarEdicao}
                  onCancelar={() => setParcelaEmEdicaoId(undefined)}
                />
              )
              : (
                <div className="d-flex align-items-center gap-3">
                  <span>{NumberUtil.toCurrency(parcela.valor)}</span>
                  <small>{moment(parcela.dataVencimento).format('DD/MM/YYYY')}</small>
                  <button type="button" className="btn btn-sm btn-secondary" disabled={isLoading} onClick={() => setParcelaEmEdicaoId(parcela.id)}>Editar</button>
                </div>
              )}
          </div>
          {parcelaEmEdicaoId !== parcela.id && parcela.comentario && (
            <p className="m-0" dangerouslySetInnerHTML={{ __html: MarkdownUtils.render(parcela.comentario) }} />
          )}
        </li>
      ))}
    </ul>
  );
}

function EdicaoParcela({ parcela, isLoading, onSalvar, onCancelar }: { parcela: EmprestimoParcelas, isLoading: boolean, onSalvar: (parcela: EmprestimoParcelas, valor: any, dataVencimento: Date, comentario?: string) => void, onCancelar: () => void }) {
  //@ts-ignore
  const [valor, setValor] = useState(parcela.valor);
  //@ts-ignore
  const [dataVencimento, setDataVencimento] = useState<Date>(parcela.dataVencimento);
  const [comentario, setComentario] = useState(parcela.comentario);

  return (
    <div className="d-flex flex-column gap-2 flex-grow-1">
      <div className="d-flex align-items-center flex-wrap gap-2">
        <Input type="number" isNumber className="form-control form-control-sm" style={{ width: 120 }} value={valor} onChange={setValor} aria-label={`Valor da parcela ${parcela.numero}`} />
        <Input type="date" className="form-control form-control-sm" style={{ width: 150 }} value={dataVencimento} onChange={setDataVencimento} aria-label={`Vencimento da parcela ${parcela.numero}`} />
        <button type="button" className="btn btn-sm btn-primary" disabled={isLoading} onClick={() => onSalvar(parcela, valor, dataVencimento, comentario)}>Salvar</button>
        <button type="button" className="btn btn-sm btn-light" disabled={isLoading} onClick={onCancelar}>Cancelar</button>
      </div>
      <Input type="mdtextarea" className="form-control" value={comentario} onChange={setComentario} placeholder="Comentário" aria-label={`Comentário da parcela ${parcela.numero}`} />
    </div>
  );
}
