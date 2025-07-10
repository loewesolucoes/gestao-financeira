import { Input } from "@/app/components/input";
import { useStorage } from "@/app/contexts/storage";
import { CategoriaTransacoes } from "@/app/repositories/categoria-transacoes";
import { TableNames } from "@/app/repositories/default";
import { useState } from "react";

interface NovaCategoriaProps {
  categoria?: CategoriaTransacoes
  onClose: () => void
}

// TODO: add icones
// TODO: add editar categoria nas configurações

export function NovaCategoria({ categoria, onClose }: NovaCategoriaProps) {
  const { repository, refresh } = useStorage();
  const [descricao, setDescricao] = useState(categoria?.descricao || '');
  const [tipo, setTipo] = useState(categoria?.tipo || 0);
  const [comentario, setComentario] = useState(categoria?.comentario || '');
  const [active, setActive] = useState(categoria?.active ?? true);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.debug('NovaCategoria.onSubmitForm', { categoria, descricao, tipo, comentario, active });

    setIsLoading(true);

    const updatedCategoria = { ...categoria, descricao, tipo, comentario, active }

    await repository.categoriaTransacoes.save(TableNames.CATEGORIA_TRANSACOES, updatedCategoria);
    console.info('Categoria salva:', updatedCategoria);
    await refresh();
    console.debug('Categorias atualizadas após salvar:', repository.categoriaTransacoes.TODAS);
    setIsLoading(false);
    onClose();
  }

  return (
    <form className={`categoria-form w-100 d-flex gap-3 flex-column`} onSubmit={onSubmitForm}>
      <div className="flex-grow-1">
        <label htmlFor="descricao">Descrição</label>
        <Input type="text" className="form-control" id="descricao" value={descricao} onChange={setDescricao} placeholder="Descrição da categoria" />
      </div>
      <div className="d-flex gap-3 align-items-md-end align-content-between flex-md-row flex-column">
        <div className="flex-grow-1">
          <label htmlFor="tipo">Tipo</label>
          <select className="form-control" id="tipo" value={tipo} onChange={e => setTipo(Number(e.target.value))}>
            <option>Escolha um tipo</option>
            <option value="0">Pessoal</option>
            <option value="1">Financeira</option>
          </select>
        </div>
        <div className="form-check form-switch">
          <Input className="form-check-input" type="checkbox" value="" id="checkNativeSwitch" switch="true" checked={active} onChange={setActive} />
          <label className="form-check-label" htmlFor="checkNativeSwitch">
            Categoria Ativa
          </label>
        </div>
      </div>
      <div className="flex-grow-1 d-flex flex-column">
        <label htmlFor="comentario" className="form-label">Comentario (OBS)</label>
        <Input type="mdtextarea" className="form-control h-100" id="comentario" onChange={x => setComentario(x)} value={comentario} placeholder="Comentario (OBS)" />
      </div>
      <FormButtons isAllLoading={isLoading} categoria={categoria} onClose={onClose} onDelete={undefined} onReset={undefined} />
    </form>
  );
}

function FormButtons({ isAllLoading, categoria, onClose, onDelete, onReset }) {
  let title = 'Adicionar';

  if (categoria != null)
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
      {categoria && onDelete && (
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