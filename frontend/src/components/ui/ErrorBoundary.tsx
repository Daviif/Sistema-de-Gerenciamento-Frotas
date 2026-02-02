import React from 'react'

interface State {
  hasError: boolean
  error?: Error | null
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Here you could send the error to an external logging service
    console.error('Uncaught error:', error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-danger-50 rounded-lg border border-danger text-danger shadow-sm">
          <h2 className="text-lg font-semibold">Erro na aplicação</h2>
          <p className="mt-2">Algo deu errado ao renderizar esta página.</p>
          <div className="mt-4">
            <button
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1 text-white text-sm shadow"
              onClick={this.reset}
            >
              Tentar novamente
            </button>
            <button
              className="ml-2 inline-flex items-center rounded-lg bg-slate-100 px-3 py-1 text-sm shadow"
              onClick={() => window.location.reload()}
            >
              Recarregar página
            </button>
          </div>
          <details className="mt-4 text-xs text-danger">
            <summary>Detalhes</summary>
            <pre className="whitespace-pre-wrap">{String(this.state.error)}</pre>
          </details>
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}
