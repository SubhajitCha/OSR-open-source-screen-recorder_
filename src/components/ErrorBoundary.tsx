import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ServerErrorPage } from './pages/ServerErrorPage';
import { ActiveView } from '../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  onNavigate?: (view: ActiveView) => void;
  onOpenStudio?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled runtime error captured by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-white flex flex-col">
          <ServerErrorPage
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onResetError={this.handleReset}
            onOpenStudio={() => {
              this.handleReset();
              if (this.props.onOpenStudio) {
                this.props.onOpenStudio();
              }
            }}
            onNavigate={(view: ActiveView) => {
              this.handleReset();
              if (this.props.onNavigate) {
                this.props.onNavigate(view);
              }
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
