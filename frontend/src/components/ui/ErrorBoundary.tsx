import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  title?: string;
  message?: string;
  onReset?: () => void;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught an unhandled error]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      copied: false,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.handleReset();
    window.location.href = "/dashboard";
  };

  private handleCopy = async () => {
    const errorDetails = [
      `Error: ${this.state.error?.name || "Error"} - ${this.state.error?.message || "Unknown error"}`,
      `Location: ${window.location.href}`,
      `User Agent: ${navigator.userAgent}`,
      `Stack:\n${this.state.error?.stack || "No stack trace"}`,
      `Component Stack:\n${this.state.errorInfo?.componentStack || "No component stack"}`,
    ].join("\n\n");

    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error ?? new Error("Unknown error"), this.handleReset);
      }
      return this.props.fallback;
    }

    const isInline = this.props.inline;
    const title = this.props.title || "Something went wrong";
    const description =
      this.props.message ||
      "An unexpected error occurred while displaying this section. Your data is safe.";

    return (
      <div
        className={
          isInline
            ? "p-6 bg-rose-50/70 border border-rose-200/80 rounded-2xl text-slate-800 my-4"
            : "min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6"
        }
      >
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center">
          {/* Badge Icon */}
          <div className="w-14 h-14 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-4 shadow-sm ring-8 ring-rose-50">
            <AlertTriangle size={28} />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
            {description}
          </p>

          {/* Quick Error Message Display */}
          {this.state.error?.message && (
            <div className="mt-4 w-full text-left bg-rose-50/60 border border-rose-100 rounded-xl p-3 text-xs font-mono text-rose-700 break-words">
              <span className="font-bold">{this.state.error.name || "Error"}:</span> {this.state.error.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full">
            <button
              type="button"
              onClick={this.handleReset}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Home size={14} />
              Dashboard
            </button>
          </div>

          {/* Collapsible Technical Details for Debugging */}
          <div className="mt-6 w-full text-left border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>{this.state.showDetails ? "Hide technical details" : "Show technical details"}</span>
              </button>

              {this.state.showDetails && (
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  {this.state.copied ? (
                    <>
                      <Check size={12} className="text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy error</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {this.state.showDetails && (
              <div className="mt-3 bg-slate-900 rounded-2xl p-3.5 text-slate-200 text-[11px] font-mono overflow-x-auto max-h-48 scrollbar-thin">
                <p className="text-rose-400 font-bold mb-1">
                  {this.state.error?.name}: {this.state.error?.message}
                </p>
                {this.state.error?.stack && (
                  <pre className="text-slate-400 whitespace-pre-wrap text-[10px] leading-relaxed">
                    {this.state.error.stack}
                  </pre>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">Component Stack:</p>
                    <pre className="text-slate-400 whitespace-pre-wrap text-[10px]">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
