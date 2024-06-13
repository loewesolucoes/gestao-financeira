import Link from "next/link";
import { useEnv } from "../contexts/env";
import { usePathname } from "next/navigation";

// icons from https://icons.getbootstrap.com/
import HouseFillIcon from "../../../public/house-fill.svg";
import CardListIcon from "../../../public/card-list.svg";
import GraphUpArrowIcon from "../../../public/graph-up-arrow.svg";
import GearFillIcon from "../../../public/gear-fill.svg";
import ThreeDotsIcon from "../../../public/three-dots.svg";
import { useState } from "react";
import { NavbarCollapse } from "./navbar-collapse";

const pages = [
  {
    name: 'Início',
    path: '/',
    icon: <HouseFillIcon style={{ width: 27 }} />,
  },
  // {
  //   name: 'Caixa',
  //   path: '/caixa',
  //   icon: '🪙',
  // },
  {
    name: 'Notas',
    path: '/notas',
    icon: <CardListIcon style={{ width: 27 }} />,
  },
  {
    name: 'Metas',
    path: '/metas',
    icon: <GraphUpArrowIcon style={{ width: 27 }} />,
  },
]

export function BottomNavbar() {
  const { isMobile } = useEnv();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  return (
    isMobile
      ? (
        <>
          <footer className="bottom-navbar navbar fixed-bottom p-0 bg-light" >
            <NavbarCollapse show={show} className="px-3 py-3" />
            <div id="buttonGroup" className="btn-group selectors rounded-0 w-100 pb-3 bg-light" role="group" aria-label="Basic example">
              {pages.map(x => (
                <Link key={x.path} href={x.path} className={`btn btn-light rounded-0 ${pathname == x.path ? 'active' : ''}`}>
                  <div className="d-flex flex-column align-items-center justify-content-center">
                    {x.icon}
                    <span>{x.name}</span>
                  </div>
                </Link>
              ))}
              <button type="button" className={`btn btn-light rounded-0`} aria-expanded="false" aria-label="Toggle navigation" onClick={e => setShow(!show)}>
                <div className="d-flex flex-column align-items-center justify-content-center">
                  <ThreeDotsIcon style={{ width: 27 }} />
                  <span>Mais</span>
                </div>
              </button>
            </div>
          </footer>
          <div className="py-5"></div>
        </>
      )
      : null

  );
}
