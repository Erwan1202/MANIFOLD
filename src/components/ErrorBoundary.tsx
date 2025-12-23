import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WASM Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-paper border-4 border-ink">
          <div className="max-w-lg p-8 border-2 border-ink bg-paper shadow-hard">
            <h1 className="text-3xl font-serif font-bold mb-4 border-b-2 border-ink pb-2">
              ENGINE FAILURE
            </h1>
            <p className="font-mono text-sm mb-4">
              The WebAssembly module failed to initialize.
            </p>
            <div className="bg-gray-100 border border-ink p-3 mb-6 font-mono text-xs overflow-auto max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="flex gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 font-serif font-bold border-2 border-ink bg-paper hover:bg-gray-100 transition-all"
              >
                RETRY
              </button>
              <a
                href="https://webassembly.org/roadmap/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 font-serif font-bold border-2 border-ink bg-ink text-paper text-center hover:opacity-90 transition-all"
              >
                CHECK SUPPORT
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
