"use client";

import { useEnv } from "../contexts/env";

export function Footer() {
  return (
    <footer>
      <Copyright />
    </footer>
  )
}

function Copyright({ sm }: any) {
  const { packageVersion } = useEnv();
  return <p className={`copyright ${sm ? 'sm' : 'lg'}`}>&copy; {new Date().getFullYear()}&nbsp;-&nbsp;<a href="https://loewesolucoes.github.io/">@ericoloewe</a> Versão: {packageVersion}</p>;
}

