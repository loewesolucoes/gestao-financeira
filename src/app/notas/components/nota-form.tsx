"use client";

import { TableNames, Notas } from "@/app/utils/db-repository";
import { Input } from "../../components/input";
import { useState } from "react";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  nota?: Notas
  cleanStyle?: boolean
  onClose?: () => void
  onCustomSubmit?: (nota: Notas) => void
  onCustomDelete?: (nota: Notas) => void
}

export function NotaForm({ nota, cleanStyle, onClose, onCustomSubmit, onCustomDelete, }: CustomProps) {
  const { isDbOk, repository, refresh } = useStorage();
  //@ts-ignore
  const [data, setData] = useState<Date>(nota?.data || new Date());
  const [descricao, setDescricao] = useState(nota?.descricao);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    event.preventDefault();
    setIsLoading(true);

    const updatedTransaction = { ...nota, data, descricao }

    if (onCustomSubmit == null) {
      const result = await repository.save(TableNames.NOTAS, updatedTransaction);

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

    if (nota == null) throw new Error("nota invalida");

    if (onCustomDelete == null) {
      const result = await repository.delete(TableNames.NOTAS, nota.id);

      console.info('onDelete', result);

      refresh();
    } else {
      onCustomDelete(nota);
    }

    setIsLoading(false);

    onClose && onClose();
  }

  const isAllLoading = !isDbOk || isLoading

  return <form className={`nota-form w-100 ${!cleanStyle && 'card'}`} onSubmit={onSubmitForm}>
    {!cleanStyle && (<h5 className="card-header">Adicionar novo(a)</h5>)}

    <div className="d-flex flex-column px-3 py-2 gap-3">
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="local" className="form-label">Local</label>
          <Input type="text" className="form-control" id="local" onChange={x => setDescricao(x)} value={descricao} placeholder="Local" />
        </div>
        <div className="flex-grow-1">
          <label htmlFor="data" className="form-label">Data</label>
          <Input type="date" className="form-control" id="data" onChange={x => setData(x)} value={data} />
        </div>
      </div>
      <FormButtons isAllLoading={isAllLoading} nota={nota} onClose={onClose} onDelete={onDelete} />
    </div>
  </form>;
}

function FormButtons({ isAllLoading, nota, onClose, onDelete }: any) {
  let title = 'Adicionar';

  if (nota != null)
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
      {nota && onDelete && (
        <button type="button" onClick={onDelete} className="btn btn-danger align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading
            ? loadingState
            : 'Remover'}
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

