import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-md w-full bg-white rounded-lg border border-[#d4d4d4] shadow-sm p-8 text-center">
            <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#333] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#666] mb-6">
              An unexpected error occurred. You can try again or reload the page.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 text-left bg-[#f5f5f5] rounded border border-[#d4d4d4] p-3 overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 text-sm font-medium text-[#333] bg-white border border-[#d4d4d4] rounded hover:bg-[#f5f5f5] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#428bca] rounded hover:bg-[#3276b1] transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
