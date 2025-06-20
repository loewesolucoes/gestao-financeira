"use client";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { AuthButton } from "./auth-button";
import { ThemeSelector } from './theme-selector';

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
    name: 'Metas',
    path: '/metas'
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
];

interface CustomProps {
  show?: boolean
  className?: string
}

export function NavbarCollapse({ show, className }: CustomProps) {
  const pathname = usePathname();

  return <div className={`collapse navbar-collapse justify-content-between ${show && 'show'} ${className}`} id="navbarSupportedContent">
    <ul className="navbar-nav">
      {pages.map(x => (
        <li key={x.path} className="nav-item">
          <Link className={`nav-link ${pathname == x.path ? 'active' : ''}`} href={x.path}>{x.name}</Link>
        </li>
      ))}
      <ThemeSelector />
    </ul>
    <AuthButton />
  </div>;
}


