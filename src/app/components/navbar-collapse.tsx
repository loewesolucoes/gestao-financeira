"use client";
import Link from 'next/link';
import { usePathname } from "next/navigation";
import { AuthButton } from "./auth-button";
import { ThemeSelector } from './theme-selector';
import IconHouse from '@material-design-icons/svg/filled/home.svg';
import IconWallet from '@material-design-icons/svg/filled/wallet.svg';
import IconPiggy from '@material-design-icons/svg/filled/savings.svg';
import IconStickies from '@material-design-icons/svg/filled/sticky_note_2.svg';
import IconChecklist from '@material-design-icons/svg/filled/emoji_events.svg';
import IconBank from '@material-design-icons/svg/filled/account_balance.svg';
import IconFileBarGraph from '@material-design-icons/svg/filled/analytics.svg';
import IconGear from '@material-design-icons/svg/filled/settings.svg';
import IconQuestion from '@material-design-icons/svg/filled/contact_support.svg';

const pages = [
  {
    name: 'Início',
    path: '/',
    icon: <IconHouse />,
  },
  {
    name: 'Caixa',
    path: '/caixa',
    icon: <IconWallet />,
  },
  {
    name: 'Patrimônio',
    path: '/patrimonio',
    icon: <IconPiggy />,
  },
  {
    name: 'Notas',
    path: '/notas',
    icon: <IconStickies />
  },
  {
    name: 'Metas',
    path: '/metas',
    icon: <IconChecklist />
  },
  {
    name: 'Empréstimo',
    path: '/emprestimos',
    icon: <IconBank />,
  },
  {
    name: 'Relatórios',
    path: '/relatorios',
    icon: <IconFileBarGraph />
  },
  {
    name: 'Configurações',
    path: '/configuracoes',
    icon: <IconGear />
  },
  {
    name: 'Perguntas frequentes',
    path: '/faq',
    icon: <IconQuestion />,
  },
];

interface CustomProps {
  show?: boolean
  className?: string
}

export function SideBarMenu() {
  const pathname = usePathname();

  return (
    <div className="card side-bar-menu w-100">
      <div className='card-body'>
        <ul className="navbar-nav flex-grow-1">
          <li className="nav-item not-link fw-semibold">
            <span className="nav-link disabled">Menu</span>
          </li>
          {pages.map(x => (
            <li key={x.path} className={`nav-item px-2 ${pathname == x.path ? 'active' : ''}`}>
              <Link className={`nav-link`} href={x.path}>
                <span className="nav-icon">
                  {x.icon}
                </span>
                <span className='px-1'>
                  {x.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
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
      <ThemeSelector />
    </ul>
    <AuthButton />
  </div>;
}


