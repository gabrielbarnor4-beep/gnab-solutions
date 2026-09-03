import { Component, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) }
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error('ErrorBoundary caught', err, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-mist px-4 py-16 text-center">
        <p className="font-display text-5xl font-extrabold text-navy/10">Oops</p>
        <h1 className="-mt-2 font-display text-2xl font-bold text-navy">Something went wrong</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-light">
          An unexpected error interrupted this page. Try reloading — if it persists, contact GNAB support.
        </p>
        {this.state.message && (
          <p className="mt-3 max-w-lg rounded-xl bg-white px-4 py-3 font-mono text-xs text-red-600 ring-1 ring-red-100">
            {this.state.message}
          </p>
        )}
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-600"
          >
            Reload page
          </button>
          <Link
            to="/"
            onClick={() => this.setState({ hasError: false, message: '' })}
            className="rounded-full border border-navy px-6 py-3 text-sm font-semibold text-navy hover:bg-navy-50"
          >
            Go home
          </Link>
        </div>
      </div>
    )
  }
}
