import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-8">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg w-full shadow-sm">
            <h2 className="text-red-600 font-semibold text-lg mb-2">Erreur de rendu</h2>
            <pre className="text-xs text-gray-600 bg-gray-50 rounded p-3 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              onClick={() => this.setState({ error: null })}
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
