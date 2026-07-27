"use client";

import { useState } from "react";
import { Modal } from "./modal";
import { HeaderSidebar } from "./header-sidebar";
import { useAuth } from "../contexts/auth";



export function Header() {
  const [show, setShow] = useState(false);
  const { userInfo } = useAuth();

  function getUserPhotoLink(): string {
    return (userInfo?.user?.photoLink?.replace('=s64', '=s240')) || `${process.env.BASE_PATH || ''}/user.jpg`;
  }

  return (
    <>
      <header className="d-flex d-xl-none navbar navbar-expand-xl">
        <div className="container-fluid">
          <button className="navbar-toggler btn-sm" type="button" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation" onClick={e => setShow(!show)}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="user-info">
            <img src={getUserPhotoLink()} alt="Logo" className="rounded-circle" style={{ width: '40px', height: '40px' }} />
          </div>
        </div>
      </header>
      {show && (
        <Modal hideFooter={true} hideHeader={true} onClose={() => setShow(false)} fullScreen={true} style={{ zIndex: 1031 }}>
          <HeaderSidebar mobile={true} onClose={() => setShow(false)} />
        </Modal>
      )}
    </>
  );
}


