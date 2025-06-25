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

function Copyright() {
  const { version } = useEnv();

  const versionOrDefault = version || '0.1.0';

  return <p className={`copyright`}>&copy; {new Date().getFullYear()}&nbsp;-&nbsp;<Link href="https://loewesolucoes.github.io/" target="_blank">@ericoloewe</Link> Versão atual: <Link href={`https://github.com/loewesolucoes/gestao-financeira/releases/tag/v${versionOrDefault}`} target="_blank">v{versionOrDefault}</Link></p>;
}

