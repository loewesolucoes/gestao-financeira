import Link from "next/link";
import { useEnv } from "../contexts/env";
import { usePathname } from "next/navigation";

// icons from https://icons.getbootstrap.com/
import HouseFillIcon from "@material-design-icons/svg/two-tone/home.svg";
import CardListIcon from "@material-design-icons/svg/two-tone/sticky_note_2.svg";
import GraphUpArrowIcon from "@material-design-icons/svg/two-tone/emoji_events.svg";
import ThreeDotsIcon from "@material-design-icons/svg/two-tone/menu.svg";
import { useState } from "react";
import { Modal } from "./modal";
import { HeaderSidebar } from "./header-sidebar";

const pages = [
  {
    name: 'Início',
    path: '/',
    icon: <HouseFillIcon width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-gray)" />,
  },
  {
    name: 'Notas',
    path: '/notas',
    icon: <CardListIcon width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-gray)" />,
  },
  {
    name: 'Metas',
    path: '/metas',
    icon: <GraphUpArrowIcon width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-gray)" />,
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
          <footer className="bottom-navbar navbar fixed-bottom p-0 bg-light">
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
                  <ThreeDotsIcon width={30} height={30} viewBox="0 0 24 24" fill="var(--bs-gray)" />
                  <span>Mais</span>
                </div>
              </button>
            </div>
          </footer>
          <div className="py-5"></div>
          {show && (
            <Modal hideFooter={true} hideHeader={true} onClose={() => setShow(false)} fullScreen={true} style={{ zIndex: 1031 }}>
              <HeaderSidebar mobile={true} onClose={() => setShow(false)} />
            </Modal>
          )}
        </>
      )
      : null

  );
}
