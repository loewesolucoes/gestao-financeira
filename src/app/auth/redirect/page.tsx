"use client";

import { Loader } from "@/app/components/loader";
import "./page.scss";
import { Layout } from "@/app/shared/layout";
import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/app/contexts/auth";
import { useLocation } from "@/app/contexts/location";
import { useErrorHandler } from "@/app/contexts/error-handler";


function Redirect() {
  const { params, redirectTo } = useLocation();
  const { doAuth } = useAuth();
  const { handleError } = useErrorHandler();
  const code = params.get('code');

  useEffect(() => {
    console.debug("loading redirect with code:", code);

    if (code != null)
      load();
    else
      handleError(new Error("Código de autenticação não encontrado na URL."));
  }, []);

  async function load() {
    try {
      await doAuth(code as string);

      redirectTo('/');
    } catch (ex) {
      handleError(ex);
    }
  }

  return (
    <main className="container redirect">
      <h1>Redirecionando <Loader /></h1>
      <p>Você será redirecionado para a página inicial em breve.</p>
      <p>Aguarde alguns segundos e se não for redirecionado automaticamente, <Link href="/">clique aqui</Link>.</p>
    </main>
  )
}

export default function Page() {
  return (
    <Layout noHeader>
      <Redirect />
    </Layout>
  );
}


