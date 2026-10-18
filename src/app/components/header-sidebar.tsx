"use client";

import Link from "next/link";
import { SideBarMenu } from "./navbar-collapse";
import IconEnvelope from '@material-design-icons/svg/outlined/inbox.svg';
import IconBell from '@material-design-icons/svg/outlined/notifications.svg';
import IconClose from '@material-design-icons/svg/outlined/close.svg';
import { ThemeSelector } from "./theme-selector";
import { AuthButton } from "./auth-button";
import { useAuth } from "../contexts/auth";
import { useNotification } from "../contexts/notification";
import { Loader } from "./loader";

const basePath = process.env.BASE_PATH || '';


function UserInfo() {
  const { userInfo, isLoadingAuth } = useAuth();
  const { naoLidasNotificacoes, naoLidasMensagens } = useNotification();

  function getUserPhotoLink(): string {
    return (userInfo?.user?.photoLink?.replace('=s64', '=s240')) || `${process.env.BASE_PATH || ''}/user.jpg`;
  }

  if (isLoadingAuth) return <Loader className="" />;

  return (
    <div className="user-row">
      <img className="user-avatar" src={getUserPhotoLink()} alt="" />
      <span className="user-name">{userInfo?.user?.displayName}</span>
      <Link className="ps-icon-btn position-relative" href="/notificacoes?tipo=notificacao" aria-label="Notificações">
        <IconBell width="24" height="24" viewBox="0 0 24 24" />
        {naoLidasNotificacoes > 0 && <span className="nav-dot bg-secondary" />}
      </Link>
      <Link className="ps-icon-btn position-relative" href="/notificacoes?tipo=mensagem" aria-label="Mensagens">
        <IconEnvelope width="24" height="24" viewBox="0 0 24 24" />
        {naoLidasMensagens > 0 && <span className="nav-dot bg-danger" />}
      </Link>
    </div>
  );
}


// Desktop: sticky panel from 1200px. Mobile: the same panel, full width inside the menu modal.
export function HeaderSidebar({ mobile, onClose }: { mobile?: boolean, onClose?: () => void }) {
  return (
    <header className={`sidebar flex-shrink-0 ${mobile ? 'sidebar-mobile d-flex' : 'sidebar-desktop d-none d-xl-flex'}`}>
      <div className="ps-sidebar">
        <div className="d-flex align-items-center justify-content-between">
          <Link
            href="/"
            rel="noopener noreferrer"
            className='navbar-brand logo-link d-flex align-items-center m-0'
            onClick={onClose}
          >
            <img className="logo-img logo-light" src={`${basePath}/brand/logo-horizontal.svg`} alt="Planner financeiro" />
            <img className="logo-img logo-dark" src={`${basePath}/brand/logo-horizontal-escuro.svg`} alt="" aria-hidden="true" />
          </Link>
          {onClose && (
            <button type="button" className="ps-icon-btn" aria-label="Fechar menu" onClick={onClose}>
              <IconClose width="24" height="24" viewBox="0 0 24 24" />
            </button>
          )}
        </div>
        <SideBarMenu onNavigate={onClose} />
        <div className="sidebar-footer">
          <UserInfo />
          <ThemeSelector />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
