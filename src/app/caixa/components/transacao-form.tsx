"use client";

import { Input } from "../../components/input";
import { useState } from "react";
import BigNumber from "bignumber.js";
import { useStorage } from "@/app/contexts/storage";
import { useEnv } from "@/app/contexts/env";
import { TableNames } from "@/app/repositories/default";
import { TipoDeReceita, Transacoes } from "@/app/repositories/transacoes";
import { Modal } from "@/app/components/modal";
import { NovaCategoria } from "./nova-categoria";

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
  const { isMobile } = useEnv();
  //@ts-ignore
  const [valor, setValor] = useState<BigNumber>(transacao?.valor || BigNumber());
  const [data, setData] = useState<Date>(transacao?.data || new Date());
  const [tipo, setTipo] = useState(transacao?.tipo);
  const [local, setLocal] = useState(transacao?.local);
  const [comentario, setComentario] = useState(transacao?.comentario);
  const [categoriaId, setCategoria] = useState(transacao?.categoriaId || 1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNewCategoriaModalOpen, setIsNewCategoriaModalOpen] = useState<boolean>(false);
  const isPatrimonio = tableName === TableNames.PATRIMONIO;

  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    event.preventDefault();
    setIsLoading(true);

    const updatedTransaction = { ...transacao, valor, data, tipo, local, comentario }

    if (tableName === TableNames.PATRIMONIO)
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

  function onReset() {
    // @ts-ignore
    setValor(BigNumber());
    setData(new Date());
    setTipo(TipoDeReceita.VARIAVEL);
    setLocal('');
    setComentario('');
    setCategoria(1);
  }

  const isAllLoading = !isDbOk || isLoading

  return <>
    <form className={`transacao-form w-100 ${!cleanStyle && 'card'}`} onSubmit={onSubmitForm}>
      {!cleanStyle && (<h5 className="card-header">Adicionar novo(a)</h5>)}

      <div className="d-flex flex-column px-3 py-2 gap-3">
        <div className="d-flex gap-3 flex-column flex-md-row w-100">
          <div className={`flex-grow-1 ${!isPatrimonio && 'w-100'}`}>
            <label htmlFor="local" className="form-label">Local</label>
            <Input type="text" className="form-control" id="local" onChange={x => setLocal(x)} value={local} placeholder="Local" />
          </div>
        </div>
        <div className="d-flex gap-3 flex-column flex-md-row w-100">
          <div className="flex-grow-1">
            <label htmlFor="valorAplicado" className="form-label">Valor aplicado</label>
            <Input type="number" className="form-control" id="valorAplicado" groupSymbolLeft="R$" onChange={x => setValor(x)} value={valor} />
          </div>
          {isPatrimonio ? <DataInput data={data} setData={setData} isPatrimonio={isPatrimonio} /> : null}
          {!isPatrimonio && (
            <div className="flex-grow-1">
              <label htmlFor="categoria" className="form-label">Categoria</label>
              <div className="input-group mb-3">
                <button type="button" className="btn btn-outline-secondary" title="Adicionar nova categoria" onClick={() => setIsNewCategoriaModalOpen(true)}>➕</button>
                <select className={`form-select ${!isMobile && 'form-control-sm'}`} id="categoria" onChange={e => setCategoria(Number(e.target.value))} defaultValue={categoriaId}>
                  {repository?.categoriaTransacoes?.TODAS.map(c => (
                    <option key={c.id} value={c.id} defaultChecked={c.id === 1}>{c.descricao}</option>
                  ))}
                </select>
              </div>
              <small id="passwordHelpBlock" className="form-text">
                Para adicionar uma nova categoria, clique no botão "➕" ao lado.
              </small>
            </div>
          )}
        </div>
        <div className="d-flex gap-3 flex-column flex-md-row w-100">
          <ComentarioInput comentario={comentario} setComentario={setComentario} />
          <div className="d-flex gap-3 flex-column">
            {!isPatrimonio ? <DataInput data={data} setData={setData} isPatrimonio={isPatrimonio} /> : null}
            {!isPatrimonio
              ? (
                <div className="flex-grow-1">
                  <label htmlFor="tipoReceita" className="form-label">Tipo de receita</label>
                  <select className={`form-select ${!isMobile && 'form-control-sm'}`} id="tipoReceita" onChange={e => setTipo(Number(e.target.value))} defaultValue={tipo}>
                    <option value={TipoDeReceita.VARIAVEL}>Variável</option>
                    <option value={TipoDeReceita.FIXO}>Fixo</option>
                  </select>
                </div>
              ) : null}
          </div>
        </div>
        <FormButtons isAllLoading={isAllLoading} transacao={transacao} onClose={onClose} onDelete={onDelete} onReset={onReset} />
      </div>
    </form>

    {isNewCategoriaModalOpen && (
      <Modal title="Adicionar Nova Categoria" onClose={() => setIsNewCategoriaModalOpen(false)} hideFooter={true}>
        <NovaCategoria onClose={() => setIsNewCategoriaModalOpen(false)} />
      </Modal>
    )}
  </>;
}

function DataInput({ setData, data, isPatrimonio }) {
  const { isMobile } = useEnv();

  return (
    <div className="flex-grow-1">
      <label htmlFor="data" className="form-label">Data</label>
      <Input type="date" className={`form-control ${!isMobile && !isPatrimonio && 'form-control-sm'}`} id="data" onChange={x => setData(x)} value={data} />
    </div>
  )
}

function ComentarioInput({ setComentario, comentario }: { setComentario: (value: string) => void, comentario?: string }) {
  return (
    <div className="flex-grow-1 d-flex flex-column w-100 h-100">
      <label htmlFor="comentario" className="form-label">Comentario (OBS)</label>
      <Input type="mdtextarea" className="form-control h-100" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentario (OBS)" />
    </div>
  );
}

function FormButtons({ isAllLoading, transacao, onClose, onDelete, onReset }) {
  let title = 'Adicionar';

  if (transacao != null)
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
      {transacao && onDelete && (
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

