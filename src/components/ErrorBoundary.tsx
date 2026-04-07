import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SleepSeed] Unhandled error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#060912',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
          textAlign: 'center',
          fontFamily: "'Nunito', system-ui, sans-serif",
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🌙</div>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 24,
            fontWeight: 700,
            color: '#F4EFE8',
            marginBottom: 10,
            letterSpacing: '-0.3px',
          }}>
            Something drifted off course
          </div>
          <div style={{
            fontSize: 14,
            color: 'rgba(244,239,232,.4)',
            lineHeight: 1.65,
            maxWidth: 320,
            marginBottom: 32,
          }}>
            The stars are still here. Let's find our way back.
          </div>
          <div style={{
            fontSize: 10,
            color: 'rgba(244,239,232,.2)',
            fontFamily: "'DM Mono', monospace",
            maxWidth: 400,
            wordBreak: 'break-all',
            marginBottom: 20,
          }}>
            {this.state.errorMessage}
          </div>
          <button
            onClick={() => {
              // Clear sleepseed app state but preserve auth (sb-* keys)
              try {
                Object.keys(localStorage).filter(k => k.startsWith('sleepseed_') || k.startsWith('ss2_') || k.startsWith('ss_')).forEach(k => localStorage.removeItem(k));
              } catch {}
              this.setState({ hasError: false });
              window.location.href = window.location.origin;
            }}
            style={{
              padding: '14px 32px',
              borderRadius: 16,
              border: 'none',
              background: 'linear-gradient(135deg, #a06010, #F5B84C 50%, #a06010)',
              color: '#080200',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'Nunito', system-ui, sans-serif",
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(245,184,76,.25)',
            }}
          >
            Return home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
