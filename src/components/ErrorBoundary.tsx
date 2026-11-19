import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8">
          <div className="bg-card border border-destructive/40 rounded-xl p-6 max-w-lg w-full shadow-sm">
            <h2 className="text-destructive font-semibold text-lg mb-2">Erreur de rendu</h2>
            <pre className="text-xs text-muted-foreground bg-muted rounded p-3 overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
            </pre>
            <Button className="mt-4" onClick={() => this.setState({ error: null })}>
              Réessayer
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
