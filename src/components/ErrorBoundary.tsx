import * as React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 glass-panel rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
          <h2 className="text-lg font-bold text-red-500 mb-2">Algo salió mal</h2>
          <p className="text-sm text-text-muted mb-4">
            {this.state.error?.message || 'Ha ocurrido un error inesperado.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-bg-dark font-bold rounded-lg text-sm"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
