import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-serif text-2xl">Something failed to render</h1>
        <p className="mt-3 opacity-70">
          The page hit an unexpected error. You can reload, or head back to the{' '}
          <a className="underline" href="/">
            demonstrator home
          </a>
          .
        </p>
        <pre className="mt-6 overflow-x-auto rounded bg-black/5 p-3 text-left text-xs opacity-60">
          {this.state.error.message}
        </pre>
      </div>
    )
  }
}
