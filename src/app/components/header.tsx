"use client";

import Logo from "../../../public/logo.svg";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthButton } from "./auth-button";

const pages = [
  {
    name: 'Início',
    path: '/'
  },
  {
    name: 'Caixa',
    path: '/caixa'
  },
  {
    name: 'Patrimônio',
    path: '/patrimonio'
  },
  {
    name: 'Notas',
    path: '/notas'
  },
  {
    name: 'Empréstimo',
    path: '/emprestimos'
  },
  {
    name: 'Relatórios',
    path: '/relatorios'
  },
  {
    name: 'Configurações',
    path: '/configuracoes'
  },
  {
    name: 'Perguntas frequentes',
    path: '/faq'
  },
]

export function Header() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();

  return <header className="navbar navbar-expand-lg bg-body-tertiary">
    <div className="container-fluid">
      <Link
        href="/"
        rel="noopener noreferrer"
        className='navbar-brand logo-link d-flex align-items-center'
      >
        <Logo className="d-inline-block align-text-top me-1" />
        <span className="d-none d-sm-inline">
          Dashboard financeiro
        </span>
      </Link>
      <button className="navbar-toggler" type="button" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation" onClick={e => setShow(!show)}>
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className={`collapse navbar-collapse justify-content-between ${show && 'show'}`} id="navbarSupportedContent">
        <ul className="navbar-nav">
          {pages.map(x => (
            <li key={x.path} className="nav-item">
              <Link className={`nav-link ${pathname == x.path ? 'active' : ''}`} href={x.path}>{x.name}</Link>
            </li>
          ))}
        </ul>
        <AuthButton />
      </div>
    </div>
  </header>;

}

