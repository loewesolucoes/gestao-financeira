"use client";

import { useState } from "react";
import { Input } from "../../components/input";
import { useStorage } from "@/app/contexts/storage";
import { TableNames } from "@/app/repositories/default";
import { Emprestimos, EmprestimoComParcelas, StatusEmprestimo, TipoDeEmprestimo } from "@/app/repositories/emprestimos";
import BigNumber from "bignumber.js";

interface CustomProps {
  emprestimo?: EmprestimoComParcelas
  cleanStyle?: boolean
  onClose?: () => void
  onCustomSubmit?: (emprestimo: Emprestimos) => void
}

export function EmprestimoForm({ emprestimo, cleanStyle, onClose, onCustomSubmit }: CustomProps) {
  const { isDbOk, repository, refresh } = useStorage();

  const isEditing = emprestimo != null;
  const podeCancelar = isEditing && emprestimo.status !== StatusEmprestimo.CANCELADO && emprestimo.status !== StatusEmprestimo.QUITADO;

  const [tipo, setTipo] = useState<TipoDeEmprestimo>(emprestimo?.tipo ?? TipoDeEmprestimo.EMPRESTEI);
  const [pessoa, setPessoa] = useState(emprestimo?.pessoa);
  //@ts-ignore
  const [valorTotal, setValorTotal] = useState(emprestimo?.valorTotal);
  const [numeroParcelas, setNumeroParcelas] = useState<any>(BigNumber(emprestimo?.numeroParcelas ?? 1));
  //@ts-ignore
  const [dataInicio, setDataInicio] = useState<Date>(emprestimo?.dataInicio || new Date());
  const [comentario, setComentario] = useState(emprestimo?.comentario);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function onSubmitForm(event: import('react').ChangeEvent<any>) {
    event.preventDefault();
    setIsLoading(true);

    const numeroParcelasNumerico = Number((numeroParcelas as any)?.toNumber ? (numeroParcelas as any).toNumber() : numeroParcelas);
    const dadosAtualizados = { ...emprestimo, tipo, pessoa, valorTotal, numeroParcelas: numeroParcelasNumerico, dataInicio, comentario };

    if (onCustomSubmit == null) {
      const result = isEditing
        ? await repository.save(TableNames.EMPRESTIMOS, dadosAtualizados)
        : await repository.emprestimos.criarComParcelas(dadosAtualizados);

      console.info('onSubmitForm', result);

      await refresh();
    } else {
      onCustomSubmit(dadosAtualizados as any);
    }

    setIsLoading(false);

    onClose && onClose();
  }

  async function onCancelarEmprestimo() {
    setIsLoading(true);

    if (emprestimo == null) throw new Error("emprestimo invalido");

    await repository.emprestimos.cancelar(emprestimo.id);

    await refresh();

    setIsLoading(false);

    onClose && onClose();
  }

  function onReset() {
    setTipo(TipoDeEmprestimo.EMPRESTEI);
    setPessoa('');
    setValorTotal(undefined);
    setNumeroParcelas(BigNumber(1));
    setDataInicio(new Date());
    setComentario('');
  }

  const isAllLoading = !isDbOk || isLoading;

  return <form className={`emprestimo-form w-100 ${!cleanStyle && 'card card-material-1'}`} onSubmit={onSubmitForm}>
    {!cleanStyle && (<h5 className="card-header">Novo empréstimo</h5>)}

    <div className="d-flex flex-column px-3 py-2 gap-3">
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div>
          <label htmlFor="tipo" className="form-label">Tipo</label>
          <select className="form-select" id="tipo" onChange={e => setTipo(Number(e.target.value))} value={tipo}>
            <option value={TipoDeEmprestimo.EMPRESTEI}>Emprestei dinheiro (a receber)</option>
            <option value={TipoDeEmprestimo.TOMEI_EMPRESTADO}>Peguei emprestado (a pagar)</option>
          </select>
        </div>
        <div className="flex-grow-1">
          <label htmlFor="pessoa" className="form-label">Pessoa</label>
          <Input type="text" className="form-control" id="pessoa" onChange={x => setPessoa(x)} value={pessoa} placeholder="Nome da pessoa" />
        </div>
      </div>
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div>
          <label htmlFor="valorTotal" className="form-label">Valor total</label>
          <Input type="number" isNumber className="form-control" id="valorTotal" onChange={x => setValorTotal(x)} value={valorTotal} disabled={isEditing} />
        </div>
        <div>
          <label htmlFor="numeroParcelas" className="form-label">Número de parcelas</label>
          <Input type="number" isNumber className="form-control" id="numeroParcelas" onChange={x => setNumeroParcelas(x)} value={numeroParcelas} disabled={isEditing} />
        </div>
        <div>
          <label htmlFor="dataInicio" className="form-label">Data de início</label>
          <Input type="date" className="form-control" id="dataInicio" onChange={x => setDataInicio(x)} value={dataInicio} disabled={isEditing} />
        </div>
      </div>
      <div className="d-flex gap-3 flex-column flex-md-row w-100">
        <div className="flex-grow-1">
          <label htmlFor="comentario" className="form-label">Comentário</label>
          <Input type="mdtextarea" className="form-control" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentário" />
        </div>
      </div>
      <FormButtons isAllLoading={isAllLoading} isEditing={isEditing} podeCancelar={podeCancelar} onClose={onClose} onCancelarEmprestimo={onCancelarEmprestimo} onReset={onReset} />
    </div>
  </form>;
}

function FormButtons({ isAllLoading, isEditing, podeCancelar, onClose, onCancelarEmprestimo, onReset }: any) {
  const loadingState = <>
    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
    <span role="status">{" "}...</span>
  </>;

  return (
    <div className="d-flex gap-2 justify-content-end">
      {onClose && (
        <button type="button" onClick={onClose} className="btn btn-secondary align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading ? loadingState : 'Fechar'}
        </button>
      )}
      {podeCancelar && (
        <button type="button" onClick={onCancelarEmprestimo} className="btn btn-danger align-self-end mt-2" disabled={isAllLoading}>
          {isAllLoading ? loadingState : 'Cancelar empréstimo'}
        </button>
      )}
      {!isEditing && onReset && (
        <button type="button" onClick={onReset} className="btn btn-light align-self-end mt-2" disabled={isAllLoading}>
          Limpar campos
        </button>
      )}
      <button type="submit" className="btn btn-primary align-self-end mt-2" disabled={isAllLoading}>
        {isAllLoading ? loadingState : (isEditing ? 'Salvar' : 'Adicionar')}
      </button>
    </div>
  )
}
