'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
};

type State = {
  hasError: boolean;
};

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SectionErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="font-semibold text-foreground">
            {this.props.fallbackTitle ?? 'No se pudo cargar esta sección'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.props.fallbackMessage ??
              'Ocurrió un error al mostrar el contenido. Intenta recargar la página.'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Reintentar
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
