"use client";

import { Input } from "../../components/input";
import { useState } from "react";
import { useStorage } from "@/app/contexts/storage";
import { EnumUtil } from "@/app/utils/enum";
import { TableNames } from "@/app/repositories/default";
import { Metas, TipoDeMeta } from "@/app/repositories/metas";

interface CustomProps {
  meta?: Metas
  cleanStyle?: boolean
  onClose?: () => void
  onCustomSubmit?: (meta: Metas) => void
  onCustomDelete?: (meta: Metas) => void
}

export function MetasForm({ meta, cleanStyle, onClose, onCustomSubmit, onCustomDelete, }: CustomProps) {
  const { isDbOk, repository, refresh } = useStorage();
  //@ts-ignore
  const [data, setData] = useState<Date>(meta?.data || new Date());
  const [descricao, setDescricao] = useState(meta?.descricao);
  const [comentario, setComentario] = useState(meta?.comentario);
  const [tipo, setTipo] = useState<TipoDeMeta>(meta?.tipo || TipoDeMeta.PESSOAL);

  const [isLoading, setIsLoading] = useState<boolean>(false);


  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    event.preventDefault();
    setIsLoading(true);

    const updatedTransaction = { ...meta, data, descricao, comentario, tipo }

    if (onCustomSubmit == null) {
      const result = await repository.save(TableNames.METAS, updatedTransaction);

      console.info('onSubmitForm', result);

      await refresh();
    } else {
      onCustomSubmit(updatedTransaction as any);
    }

    setIsLoading(false);

    onClose && onClose();
  }

  async function onDelete() {
    setIsLoading(true);

    if (meta == null) throw new Error("meta invalida");

    if (onCustomDelete == null) {
      const result = await repository.delete(TableNames.METAS, meta.id);

      console.info('onDelete', result);

      refresh();
    } else {
      onCustomDelete(meta);
    }

    setIsLoading(false);

    onClose && onClose();
  }

  function onReset() {
    setData(new Date());
    setDescricao('');
    setComentario('');
    setTipo(TipoDeMeta.PESSOAL);
  }

  const isAllLoading = !isDbOk || isLoading

  return <form className={`meta-form w-100 ${!cleanStyle && 'card'}`} onSubmit={onSubmitForm}>
    {!cleanStyle && (<h5 className="card-header">Adicionar novo(a)</h5>)}

    <div className="d-flex flex-column px-3 py-2 gap-3">
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="descricao" className="form-label">Descrição</label>
          <Input type="text" className="form-control" id="descricao" onChange={x => setDescricao(x)} value={descricao} placeholder="Descrição" />
        </div>
        <div>
          <label htmlFor="data" className="form-label">Data de conclusão</label>
          <Input type="month" className="form-control" id="data" onChange={x => setData(x)} value={data} />
        </div>
        <div>
          <label htmlFor="tipoReceita" className="form-label">Tipo de meta</label>
          <select className="form-select" id="tipoReceita" onChange={e => setTipo(Number(e.target.value))} value={tipo}>
            {EnumUtil.values(TipoDeMeta).map(x => (
              <option key={x} value={TipoDeMeta[x]}>{x}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="comentario" className="form-label">Comentário</label>
          <Input type="mdtextarea" className="form-control" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentário" />
        </div>
      </div>
      <FormButtons isAllLoading={isAllLoading} meta={meta} onClose={onClose} onDelete={onDelete} onReset={onReset} />
    </div>
  </form>;
}

function FormButtons({ isAllLoading, meta, onClose, onDelete, onReset }: any) {
  let title = 'Adicionar';

  if (meta != null)
    title = 'Salvar'

  const loadingState = <>
    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
    <span role="status">{" "}...</span>
  </>;

  return (
    <div className="d-flex gap-2 justify-content-end">
      {onClose && (
        <button type="button" onClick={onClose} className="btn btn-secondary align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading
            ? loadingState
            : 'Fechar'}
        </button>
      )}
      {meta && onDelete && (
        <button type="button" onClick={onDelete} className="btn btn-danger align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading
            ? loadingState
            : 'Remover'}
        </button>
      )}
      {onReset && (
        <button type="button" onClick={onReset} className="btn btn-light align-self-end mt-2" disabled={isAllLoading}>
          Limpar campos
        </button>
      )}
      <button type="submit" className="btn btn-primary align-self-end mt-2" disabled={isAllLoading}>
        {isAllLoading
          ? loadingState
          : title}
      </button>
    </div>
  )
}

