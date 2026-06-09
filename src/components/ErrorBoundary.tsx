import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <section className="premium-card premium-glass mx-auto mt-8 max-w-lg rounded-[1.85rem] p-8 text-center">
          <div className="grid place-items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-uba-danger/30 bg-uba-danger/10 text-2xl">
              !
            </span>
            <h2 className="text-xl font-black tracking-[-0.04em] text-[color:var(--app-text)]">
              Something went wrong
            </h2>
            <p className="max-w-sm text-sm leading-6 text-app-muted">
              A page error was caught. Try navigating back to the home screen.
            </p>
            <details className="w-full text-left">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-uba-danger">
                Error details
              </summary>
              <pre className="mt-3 overflow-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-card-strong)] p-4 text-xs leading-5 text-app-muted">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              type="button"
              onClick={() => window.location.href = '/'}
              className="inline-flex rounded-full border border-uba-gold/45 bg-uba-gold/15 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-uba-gold-light transition hover:bg-uba-gold/22"
            >
              Back to home
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
