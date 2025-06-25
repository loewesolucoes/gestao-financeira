import { ErrorBoundary } from "react-error-boundary";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { useEffect } from "react";

export function ErrorHandler({ children, noHeader }: { children: React.ReactNode, noHeader?: boolean }) {
  return (
    <ErrorBoundary fallbackRender={p => (<ErrorFallback {...p} noHeader={noHeader} />)}>
      {children}
    </ErrorBoundary>
  );
}

function ErrorFallback({ error, resetErrorBoundary, noHeader }: { error: Error; resetErrorBoundary: () => void; noHeader?: boolean }) {
  useEffect(() => {
    if (error != null) {
      sendDataToTagManager(error);
    }
  }, [error]);

  function sendDataToTagManager(error: Error) {
    try {
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        console.info("Enviando dados para o dataLayer do Google Tag Manager");
        console.debug("Dados do erro:", error);

        (window as any).dataLayer.push({
          event: 'error',
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorName: error?.name,
        });
      } else {
        console.warn("dataLayer não está disponível.");
      }
    } catch (ex) {
      console.warn("Não foi possível enviar os dados para o dataLayer (GTM)", ex);
    }
  }

  return (
    <>
      {noHeader ? null : <Header />}
      <main className="container my-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Ocorreu um erro inesperado</h4>
          <p>
            Algo deu errado. Por favor, tente novamente ou contate o suporte em&nbsp;
            <a href="https://loewesolucoes.github.io/" target="_blank" rel="noopener noreferrer">
              loewesolucoes.github.io
            </a>.
          </p>
          <details style={{ whiteSpace: "pre-wrap" }}>
            <summary>Detalhes do erro</summary>
            <pre>{error.message}</pre>
            <code>{error.stack}</code>
          </details>
          <button
            type="button"
            onClick={resetErrorBoundary}
            className="btn btn-light mt-3"
          >
            Tentar novamente
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
