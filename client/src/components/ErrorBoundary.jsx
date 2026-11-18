import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SKT ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex items-center justify-center p-6 selection:bg-[#FF4D00] selection:text-black font-sans">
          <div className="w-full max-w-lg p-8 rounded-3xl bg-[#0D0D0D] border border-white/10 shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-black border border-[#FF4D00]/50 flex items-center justify-center mx-auto text-[#FF4D00] shadow-[0_0_20px_rgba(255,77,0,0.3)]">
              <span className="text-xl font-black">S</span>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 inline-block">
                Display Recovery System
              </span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Session Restored
              </h1>
              <p className="text-xs text-[#A3A3A3] leading-relaxed max-w-sm mx-auto">
                An unexpected display exception was safely isolated. Your data and session remain secure.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-black/60 border border-white/5 rounded-xl p-3 max-h-32 overflow-y-auto text-[11px] font-mono text-[#737373]">
                {this.state.error?.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#FF4D00] text-black font-bold text-xs tracking-wider uppercase hover:bg-[#FF7A00] transition-all cursor-pointer shadow-lg shadow-[#FF4D00]/20"
              >
                Reload Studio
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white font-medium text-xs tracking-wider uppercase hover:bg-white/10 transition-all cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
