"use client";

import Link from "next/link";
import { SideBarMenu } from "./navbar-collapse";
import Logo from "../../../public/logo.svg";
import IconEnvelope from 'bootstrap-icons/icons/envelope-open-fill.svg';
import IconBell from 'bootstrap-icons/icons/bell-fill.svg';
import IconCog from 'bootstrap-icons/icons/gear-fill.svg';
import { ThemeSelector } from "./theme-selector";
import { AuthButton } from "./auth-button";
import { useAuth } from "../contexts/auth";
import { Loader } from "./loader";


function UserInfo() {
  const { userInfo, isLoadingAuth } = useAuth();

  function getUserPhotoLink(): string {
    return (userInfo?.user?.photoLink?.replace('=s64', '=s240')) || `${process.env.BASE_PATH || ''}/user.jpg`;
  }

  return (
    <div className="card user-info-card text-center mb-4 w-75">
      {isLoadingAuth ? (
        <div className="card-body mt-4">
          <Loader className="" />
        </div>
      ) : (
        <>
          <Link href="#">
            <img className="rounded-circle profile-image position-absolute top-0 start-50 translate-middle mb-2" src={getUserPhotoLink()} alt="Profile Image" />
          </Link>
          <div className="card-body mt-4">
            <h6 className="fw-bold mb-3">{userInfo?.user?.displayName}</h6>
            <ul className="list-inline">
              <li className="list-inline-item position-relative me-3">
                <Link className="nav-link p-0" href="#" role="button" aria-expanded="false">
                  <IconBell />
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-secondary border rounded-circle"></span>
                </Link>
              </li>
              <li className="list-inline-item position-relative me-3">
                <Link className="nav-link p-0" href="#" role="button" aria-expanded="false">
                  <IconEnvelope />
                  <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"></span>
                </Link>
              </li>
              <li className="list-inline-item position-relative">
                <Link className="nav-link p-0" href="/configuracoes" role="button" aria-expanded="false">
                  <IconCog />
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );

}


export function HeaderSidebar({ mobile, onClose }: { mobile?: boolean, onClose?: () => void }) {
  return (
    <header className={`sidebar p-3 flex-column flex-shrink-0 ${!mobile && 'd-none d-lg-flex'}`} style={{ width: !mobile && '320px', minHeight: '100vh' }}>
      {onClose && (
        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={onClose} style={{ position: 'absolute', right: 15, top: 15 }}></button>
      )}
      <Link
        href="/"
        rel="noopener noreferrer"
        className='navbar-brand logo-link d-flex align-items-center mb-5'
      >
        <Logo className="d-inline-block align-text-top me-1" />
        <span className="d-inline">
          Planner financeiro
        </span>
      </Link>
      <UserInfo />
      <SideBarMenu />
      <SideBarExtra />
    </header>
  );
}


function SideBarExtra() {
  return (
    <>
      <div className="card w-100 mt-3 user-info-card">
        <div className='card-body'>
          <ul className="navbar-nav flex-grow-1">
            <ThemeSelector />
          </ul>
        </div>
      </div>
      <div className="card w-100 mt-3 user-info-card">
        <div className='card-body'>
          <ul className="navbar-nav flex-grow-1">
            <li className="nav-item not-link">
              <AuthButton />
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}

