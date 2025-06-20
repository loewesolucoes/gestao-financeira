"use client";

import Link from "next/link";
import { useEnv } from "../contexts/env";

export function Footer() {
  return (
    <footer className="footer container">
      <Copyright />
    </footer>
  )
}

function Copyright({ sm }: any) {
  const { version } = useEnv();

  const versionOrDefault = version || '0.1.0';

  return <p className={`copyright ${sm ? 'sm' : 'lg'}`}>&copy; {new Date().getFullYear()}&nbsp;-&nbsp;<a href="https://loewesolucoes.github.io/">@ericoloewe</a> Versão atual: <Link href={`https://github.com/loewesolucoes/gestao-financeira/releases/tag/v${versionOrDefault}`} target="_blank">v{versionOrDefault}</Link></p>;
}

