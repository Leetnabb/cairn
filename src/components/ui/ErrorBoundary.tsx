import { Component, type ReactNode, type ErrorInfo } from 'react';
import i18n from '../../i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[var(--bg-lane)]">
          <div className="text-center p-8">
            <h1 className="text-lg font-bold text-text-primary mb-2">{i18n.t('errors.title')}</h1>
            <p className="text-sm text-text-secondary mb-4">{i18n.t('errors.description')}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-primary text-white rounded hover:opacity-90 transition-opacity"
            >
              {i18n.t('errors.reload')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
