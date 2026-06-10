import React from 'react';

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any) {
    console.error("ErrorBoundary caught an error:", error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4 text-center">
          <div className="max-w-md w-full p-8 bg-red-50 rounded-2xl border border-red-100 shadow-xl">
            <h1 className="text-2xl font-bold text-red-900 mb-2">Something went wrong</h1>
            <p className="text-red-700 mb-6 text-sm">We apologized for the inconvenience. Please try refreshing the application.</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition"
            >
              Refresh App
            </button>
            {this.state.error && (
              <pre className="mt-6 p-4 bg-white/50 rounded text-left text-[10px] text-red-800 overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
