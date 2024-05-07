"use client";

import { Caixa, DbRepository, TipoDeReceita } from "@/app/utils/db-repository";
import { Input } from "../../components/input";
import { useState } from "react";
import BigNumber from "bignumber.js";
import { useStorage } from "@/app/contexts/storage";

interface CustomProps {
  transacao?: Caixa
}

export function TransacaoForm({ transacao }: CustomProps) {
  console.log("transacao", transacao);

  const { isDbOk, repository } = useStorage();
  //@ts-ignore
  const [valor, setValor] = useState<BigNumber>(transacao?.valor || BigNumber());
  const [data, setData] = useState<Date>(transacao?.data || new Date());
  const [tipo, setTipo] = useState(transacao?.tipo);
  const [local, setLocal] = useState(transacao?.local);
  const [comentario, setComentario] = useState(transacao?.comentario);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    setIsLoading(true);
    event.preventDefault();

    const updatedTransaction = { ...transacao, valor, data, tipo, local, comentario }

    const result = await repository.save(updatedTransaction);

    console.log('onSubmitForm', result);

    setIsLoading(false);
  }

  const isAllLoading = !isDbOk || isLoading

  return <form className="transacao-form card w-100" onSubmit={onSubmitForm}>
    <h5 className="card-header">Adicione uma nova transação</h5>

    <div className="d-flex flex-column px-3 py-2">
      <div className="d-flex w-100">
        <div className="flex-grow-1">
          <label htmlFor="valorAplicado" className="form-label">Valor aplicado</label>
          <Input type="number" className="form-control" id="valorAplicado" groupSymbolLeft="R$" onChange={x => setValor(x)} value={valor} />
        </div>
        <div className="ms-3 flex-grow-1">
          <label htmlFor="data" className="form-label">Data</label>
          <Input type="date" className="form-control" id="data" onChange={x => setData(x)} value={data} />
        </div>
        <div className="ms-3 flex-grow-1">
          <label htmlFor="tipoReceita" className="form-label">Tipo de receita</label>
          <select className="form-select" id="tipoReceita" onChange={e => setTipo(e.target.value as any)} defaultValue={tipo}>
            <option value={TipoDeReceita.VARIAVEL}>Variável</option>
            <option value={TipoDeReceita.FIXO}>Fixo</option>
          </select>
        </div>
      </div>
      <div className="d-flex w-100">
        <div className="form-floating flex-grow-1">
          <Input type="text" className="form-control" id="local" onChange={x => setLocal(x)} value={local} placeholder="Local" />
          <label htmlFor="local" className="form-label">Local</label>
        </div>
        <div className="form-floating ms-3 flex-grow-1">
          <Input type="text" className="form-control" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentario (OBS)" />
          <label htmlFor="comentario" className="form-label">Comentario (OBS)</label>
        </div>
      </div>
      <button type="submit" className="btn btn-primary w-25 align-self-end mt-2" disabled={isAllLoading}>
        {isAllLoading
          ? <>
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            <span role="status">{" "}Carregando...</span>
          </>
          : 'Adicionar'}
      </button>
    </div>
  </form>;
}
