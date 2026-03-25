import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      let details = "";

      try {
        // Check if it's a Firestore JSON error
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) {
          if (parsed.error.includes("Missing or insufficient permissions")) {
            errorMessage = "Access Denied: You don't have permission to perform this action.";
            details = `Path: ${parsed.path} | Operation: ${parsed.operationType}`;
          } else if (parsed.error.includes("The query requires an index")) {
            errorMessage = "Database Index Required";
            const urlMatch = parsed.error.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/);
            if (urlMatch) {
              details = "This query requires a composite index. Please click the link below to create it in your Firebase Console.";
              return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                  <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </div>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold text-slate-900">Index Required</h1>
                      <p className="text-slate-500 text-sm">{details}</p>
                      <a 
                        href={urlMatch[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-mono break-all hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        Click here to create the required index
                      </a>
                      <p className="text-[10px] text-slate-400 italic">After clicking, wait 3-5 minutes for Firebase to build the index, then reload this page.</p>
                    </div>
                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                    >
                      Reload Application
                    </button>
                  </div>
                </div>
              );
            }
          }
        }
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900">System Error</h1>
              <p className="text-slate-500">{errorMessage}</p>
              {details && <p className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded-lg">{details}</p>}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
