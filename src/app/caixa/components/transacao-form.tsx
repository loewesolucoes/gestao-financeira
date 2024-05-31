"use client";

import { Transacoes, DbRepository, TableNames, TipoDeReceita } from "@/app/utils/db-repository";
import { Input } from "../../components/input";
import { useState } from "react";
import BigNumber from "bignumber.js";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  transacao?: Transacoes
  cleanStyle?: boolean
  onClose?: () => void
  onCustomSubmit?: (transacao: Transacoes) => void
  onCustomDelete?: (transacao: Transacoes) => void
  tableName?: TableNames
}

export function TransacaoForm({ transacao, cleanStyle, onClose, onCustomSubmit, onCustomDelete, tableName: tn }: CustomProps) {
  const tableName = tn || TableNames.TRANSACOES
  const { isDbOk, repository, refresh } = useStorage();
  //@ts-ignore
  const [valor, setValor] = useState<BigNumber>(transacao?.valor || BigNumber());
  const [data, setData] = useState<Date>(transacao?.data || new Date());
  const [tipo, setTipo] = useState(transacao?.tipo);
  const [local, setLocal] = useState(transacao?.local);
  const [comentario, setComentario] = useState(transacao?.comentario);
  const [isLoading, setIsLoading] = useState<boolean>(false);


  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    event.preventDefault();
    setIsLoading(true);

    const updatedTransaction = { ...transacao, valor, data, tipo, local, comentario }

    if (tableName === TableNames.SALDOS)
      delete updatedTransaction.tipo;


    if (onCustomSubmit == null) {
      const result = await repository.save(tableName, updatedTransaction);

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

    if (transacao == null) throw new Error("transacao invalida");

    if (onCustomDelete == null) {
      const result = await repository.delete(tableName, transacao.id);

      console.info('onDelete', result);

      refresh();
    } else {
      onCustomDelete(transacao);
    }

    setIsLoading(false);

    onClose && onClose();
  }

  const isAllLoading = !isDbOk || isLoading

  return <form className={`transacao-form w-100 ${!cleanStyle && 'card'}`} onSubmit={onSubmitForm}>
    {!cleanStyle && (<h5 className="card-header">Adicione uma nova transação</h5>)}

    <div className="d-flex flex-column px-3 py-2 gap-3">
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="local" className="form-label">Local</label>
          <Input type="text" className="form-control" id="local" onChange={x => setLocal(x)} value={local} placeholder="Local" />
        </div>
        <div className="flex-grow-1">
          <label htmlFor="comentario" className="form-label">Comentario (OBS)</label>
          <Input type="text" className="form-control" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentario (OBS)" />
        </div>
      </div>
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="valorAplicado" className="form-label">Valor aplicado</label>
          <Input type="number" className="form-control" id="valorAplicado" groupSymbolLeft="R$" onChange={x => setValor(x)} value={valor} />
        </div>
        <div className="flex-grow-1">
          <label htmlFor="data" className="form-label">Data</label>
          <Input type="date" className="form-control" id="data" onChange={x => setData(x)} value={data} />
        </div>
        {tableName !== TableNames.SALDOS
          ? (
            <div className="flex-grow-1">
              <label htmlFor="tipoReceita" className="form-label">Tipo de receita</label>
              <select className="form-select" id="tipoReceita" onChange={e => setTipo(Number(e.target.value))} defaultValue={tipo}>
                <option value={TipoDeReceita.VARIAVEL}>Variável</option>
                <option value={TipoDeReceita.FIXO}>Fixo</option>
              </select>
            </div>
          ) : null}
      </div>
      <FormButtons isAllLoading={isAllLoading} transacao={transacao} onClose={onClose} onDelete={onDelete} />
    </div>
  </form>;
}

function FormButtons({ isAllLoading, transacao, onClose, onDelete }: any) {
  let title = 'Adicionar';

  if (transacao != null)
    title = 'Salvar'

  return (
    <div className="d-flex gap-2 justify-content-end">
      {onClose && (
        <button type="button" onClick={onClose} className="btn btn-secondary align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading
            ? <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <span role="status">{" "}Carregando...</span>
            </>
            : 'Fechar'}
        </button>
      )}
      {transacao && onDelete && (
        <button type="button" onClick={onDelete} className="btn btn-danger align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading
            ? <>
              <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
              <span role="status">{" "}Carregando...</span>
            </>
            : 'Remover'}
        </button>
      )}
      <button type="submit" className="btn btn-primary align-self-end mt-2" disabled={isAllLoading}>
        {isAllLoading
          ? <>
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span role="status">{" "}Carregando...</span>
          </>
          : title}
      </button>
    </div>
  )
}

