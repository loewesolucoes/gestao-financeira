"use client";

import "./page.scss";

import { Layout } from "../shared/layout";
import { useEffect, useState } from "react";
import { useStorage } from "../contexts/storage";
import { Loader } from "../components/loader";
import { Modal } from "../components/modal";
import moment from "moment";
import { EmprestimoForm } from "./components/emprestimo-form";
import { EmprestimoParcelasList } from "./components/emprestimo-parcelas";
import { EmprestimoComParcelas, StatusEmprestimo, TipoDeEmprestimo } from "../repositories/emprestimos";
import { NumberUtil } from "../utils/number";
import { MarkdownUtils } from "../utils/markdown";

function Emprestimos() {
  const { isDbOk, repository } = useStorage();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [emprestimos, setEmprestimos] = useState<EmprestimoComParcelas[]>([]);
  const [emprestimoAEditar, setEmprestimoAEditar] = useState<EmprestimoComParcelas>();

  useEffect(() => {
    document.title = `Empréstimo | ${process.env.NEXT_PUBLIC_TITLE}`
  }, []);

  useEffect(() => {
    isDbOk && load();
  }, [isDbOk]);

  async function load() {
    setIsLoading(true);

    const result = await repository.emprestimos.listComParcelas();

    setEmprestimos(result);
    // Ressincroniza o empréstimo em edição (se houver modal aberta) com os
    // dados recém-carregados, senão a modal continua mostrando um snapshot
    // antigo (ex.: parcela marcada como paga não refletia sem dar refresh na
    // página). Se o empréstimo foi excluído, fecha a modal.
    setEmprestimoAEditar(atual => atual && result.find(e => e.id === atual.id));
    setIsLoading(false);
  }

  const ordemStatus = { [StatusEmprestimo.ATIVO]: 0, [StatusEmprestimo.QUITADO]: 1, [StatusEmprestimo.CANCELADO]: 2 };
  const emprestimosOrdenados = [...emprestimos].sort((a, b) => ordemStatus[a.status] - ordemStatus[b.status]);

  return (
    <main className="emprestimos container mt-3 d-flex flex-column gap-3">
      <h1>Empréstimo</h1>
      <EmprestimoForm />
      {isLoading
        ? <Loader className="align-self-center my-5" />
        : emprestimosOrdenados.length === 0
          ? (<div className="alert alert-info my-3" role="alert">Nenhum empréstimo cadastrado. Adicione um novo empréstimo para começar a acompanhar valores a receber e a pagar.</div>)
          : (
            <ul className="list-group list-group-material-1">
              {emprestimosOrdenados.map(emprestimo => (
                <EmprestimoItem key={emprestimo.id} emprestimo={emprestimo} onEditar={() => setEmprestimoAEditar(emprestimo)} />
              ))}
            </ul>
          )}
      {emprestimoAEditar && (
        <Modal hideFooter={true} onClose={() => setEmprestimoAEditar(undefined)} title={`Detalhes do empréstimo: ${emprestimoAEditar?.pessoa || ''}`}>
          <EmprestimoForm emprestimo={emprestimoAEditar} cleanStyle={true} onClose={() => setEmprestimoAEditar(undefined)} />
          <h6 className="mt-3">Parcelas</h6>
          <EmprestimoParcelasList parcelas={emprestimoAEditar.parcelas} onChanged={load} />
        </Modal>
      )}
    </main>
  );
}

function EmprestimoItem({ emprestimo, onEditar }: { emprestimo: EmprestimoComParcelas, onEditar: () => void }) {
  const parcelasPagas = emprestimo.parcelas?.filter(p => p.pago).length || 0;
  const totalParcelas = emprestimo.parcelas?.length || emprestimo.numeroParcelas || 0;
  const parsedComentario = MarkdownUtils.render(emprestimo.comentario);

  const corTipo = emprestimo.tipo === TipoDeEmprestimo.EMPRESTEI ? 'list-group-item-success' : 'list-group-item-warning';
  const statusLabel = { [StatusEmprestimo.ATIVO]: 'Ativo', [StatusEmprestimo.QUITADO]: 'Quitado', [StatusEmprestimo.CANCELADO]: 'Cancelado' }[emprestimo.status];

  return (
    <li className={`list-group-item ${emprestimo.status === StatusEmprestimo.CANCELADO ? 'list-group-item-secondary text-muted' : corTipo}`}>
      <div className="d-flex w-100 justify-content-between gap-3 flex-column flex-lg-row">
        <div className="d-flex flex-column gap-2">
          <h5>{emprestimo.pessoa} <span className="badge bg-dark">{statusLabel}</span></h5>
          <p className="m-0">{emprestimo.tipo === TipoDeEmprestimo.EMPRESTEI ? 'Emprestei (a receber)' : 'Peguei emprestado (a pagar)'}</p>
          <p className="m-0">{NumberUtil.toCurrency(emprestimo.valorTotal)} — {parcelasPagas}/{totalParcelas} parcelas pagas</p>
          {emprestimo.comentario && <p dangerouslySetInnerHTML={{ __html: parsedComentario }} />}
        </div>
        <div className="d-flex flex-column gap-3">
          <small>Início: {moment(emprestimo.dataInicio).format('MMMM YYYY')}</small>
          <button className="btn btn-secondary" onClick={onEditar}>Editar</button>
        </div>
      </div>
    </li>
  );
}

export default function Page() {
  return (
    <Layout>
      <Emprestimos />
    </Layout>
  );
}

