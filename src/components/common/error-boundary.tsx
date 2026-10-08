import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in dev
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }

    // Call custom handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base p-4">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-line bg-bg-panel p-6 text-center sm:p-10">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15 text-danger">
              <AlertTriangle size={28} />
            </div>

            {/* Title */}
            <h1 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl">
              Something went wrong
            </h1>

            <p className="mt-2 text-sm text-ink-muted">
              An unexpected error occurred. Don't worry — your data is safe.
            </p>

            {/* Error message (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 rounded-xl border border-danger/30 bg-danger/[.06] p-3 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-danger">
                  Error (dev only)
                </p>
                <p className="mt-1 break-all font-mono text-[11px] text-danger/90">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[10px] text-ink-faint hover:text-ink-muted">
                      Stack trace
                    </summary>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-[10px] text-ink-faint">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 active:scale-[.98]"
              >
                <RefreshCw size={15} /> Try again
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white/[.04] px-5 py-3 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-white active:scale-[.98]"
              >
                <RefreshCw size={15} /> Reload page
              </button>
              <button
                onClick={this.handleHome}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white/[.04] px-5 py-3 text-sm font-semibold text-ink-muted transition hover:border-brand-600/40 hover:text-white active:scale-[.98]"
              >
                <Home size={15} /> Go home
              </button>
            </div>

            {/* Help text */}
            <p className="mt-6 text-[11px] text-ink-faint">
              If the problem continues, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }
}