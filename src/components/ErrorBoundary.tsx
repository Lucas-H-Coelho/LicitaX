import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Pick<State, 'hasError' | 'error'> {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error("Uncaught error in ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 m-4 rounded-md bg-red-50 border border-red-200 text-red-700">
          <h1 className="text-xl font-bold mb-2">Oops! Algo deu errado.</h1>
          <p className="mb-1">
            Pedimos desculpas pelo inconveniente. Tente atualizar a página ou contate o suporte se o problema persistir.
          </p>
          {this.state.error && (
            <details className="mt-3 text-left bg-red-100 p-3 rounded border border-red-300">
              <summary className="cursor-pointer font-medium">Detalhes do Erro</summary>
              <pre className="mt-2 text-xs text-red-900 whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <>
                    <br />
                    <br />
                    <span className="font-semibold">Stack de Componentes:</span>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
                 <br />
                 <br />
                 <span className="font-semibold">Stack de Erro:</span>
                {this.state.error.stack}
              </pre>
            </details>
          )}
           <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
