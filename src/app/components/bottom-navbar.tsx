import Link from "next/link";
import { useEnv } from "../contexts/env";
import { usePathname } from "next/navigation";

const pages = [
  {
    name: 'Início',
    path: '/',
    icon: '🏠',
  },
  // {
  //   name: 'Caixa',
  //   path: '/caixa',
  //   icon: '🪙',
  // },
  {
    name: 'Notas',
    path: '/notas',
    icon: '📋',
  },
  {
    name: 'Metas',
    path: '/metas',
    icon: '📈',
  },
  {
    name: 'Configurações',
    path: '/configuracoes',
    icon: '⚙️',
  },
]

export function BottomNavbar() {
  const { isMobile } = useEnv();
  const pathname = usePathname();

  return (
    isMobile
      ? (
        <header className="bottom-navbar navbar fixed-bottom p-0" >
          <div id="buttonGroup" className="btn-group selectors rounded-0 w-100" role="group" aria-label="Basic example">
            {pages.map(x => (
              <Link key={x.path} id="home" href={x.path} className={`btn btn-light rounded-0 ${pathname == x.path ? 'active' : ''}`}>
                <div className="d-flex flex-column">
                  {x.icon}
                  <span>{x.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </header>
      )
      : null

  );
}
