"use client";

import Link from "next/link";
import { useEnv } from "../contexts/env";

export function Footer() {
  return (
    <footer>
      <Copyright />
    </footer>
  )
}

function Copyright({ sm }: any) {
  const { version } = useEnv();

  return <p className={`copyright ${sm ? 'sm' : 'lg'}`}>&copy; {new Date().getFullYear()}&nbsp;-&nbsp;<a href="https://loewesolucoes.github.io/">@ericoloewe</a> Versão atual: <Link href={`https://github.com/loewesolucoes/gestao-financeira/releases/tag/v${version}`} target="_blank">v{version}</Link></p>;
}

