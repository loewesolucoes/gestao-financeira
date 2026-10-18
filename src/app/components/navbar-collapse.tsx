"use client";
import Link from 'next/link';
import { Fragment } from 'react';
import { usePathname } from "next/navigation";
import { AuthButton } from "./auth-button";
import { ThemeSelector } from './theme-selector';
import IconHouse from '@material-design-icons/svg/outlined/home.svg';
import IconWallet from '@material-design-icons/svg/outlined/local_atm.svg';
import IconPiggy from '@material-design-icons/svg/outlined/savings.svg';
import IconStickies from '@material-design-icons/svg/outlined/sticky_note_2.svg';
import IconChecklist from '@material-design-icons/svg/outlined/emoji_events.svg';
import IconBank from '@material-design-icons/svg/outlined/account_balance.svg';
import IconFileBarGraph from '@material-design-icons/svg/outlined/analytics.svg';
import IconGear from '@material-design-icons/svg/outlined/settings.svg';
import IconQuestion from '@material-design-icons/svg/outlined/contact_support.svg';

const pages = [
  {
    name: 'Início',
    path: '/',
    icon: <IconHouse width="24" height="24" viewBox="0 0 24 24" />,
  },
  {
    name: 'Caixa',
    path: '/caixa',
    icon: <IconWallet width="24" height="24" viewBox="0 0 24 24" />,
  },
  {
    name: 'Patrimônio',
    path: '/patrimonio',
    icon: <IconPiggy width="24" height="24" viewBox="0 0 24 24" />,
  },
  {
    name: 'Notas',
    path: '/notas',
    icon: <IconStickies width="24" height="24" viewBox="0 0 24 24" />
  },
  {
    name: 'Metas',
    path: '/metas',
    icon: <IconChecklist width="24" height="24" viewBox="0 0 24 24" />
  },
  {
    name: 'Empréstimo',
    path: '/emprestimos',
    icon: <IconBank width="24" height="24" viewBox="0 0 24 24" />,
  },
  {
    name: 'Relatórios',
    path: '/relatorios',
    group: 'Análise',
    icon: <IconFileBarGraph width="24" height="24" viewBox="0 0 24 24" />
  },
  {
    name: 'Configurações',
    path: '/configuracoes',
    group: 'Conta',
    icon: <IconGear width="24" height="24" viewBox="0 0 24 24" />
  },
  {
    name: 'Perguntas frequentes',
    path: '/faq',
    group: 'Conta',
    icon: <IconQuestion width="24" height="24" viewBox="0 0 24 24" />,
  },
];

interface CustomProps {
  show?: boolean
  className?: string
}

function isActive(pathname: string, path: string): boolean {
  return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`);
}

export function SideBarMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="ps-nav" aria-label="Menu principal">
      {pages.map((x, i) => (
        <Fragment key={x.path}>
          {x.group && x.group !== pages[i - 1]?.group && <div className="ps-overline ps-nav-group">{x.group}</div>}
          <Link className="ps-nav-item" href={x.path} onClick={onNavigate} aria-current={isActive(pathname, x.path) ? 'page' : undefined}>
            {x.icon}
            {x.name}
          </Link>
        </Fragment>
      ))}
    </nav>
  );
}

export function NavbarCollapse({ show, className }: CustomProps) {
  const pathname = usePathname();

  return <div className={`collapse navbar-collapse justify-content-between ${show && 'show'} ${className}`} id="navbarSupportedContent">
    <ul className="navbar-nav">
      {pages.map(x => (
        <li key={x.path} className="nav-item">
          <Link className={`nav-link ${pathname == x.path ? 'active' : ''}`} href={x.path}>{x.icon}{' '}{x.name}</Link>
        </li>
      ))}
      <li><ThemeSelector /></li>
    </ul>
    <AuthButton />
  </div>;
}


