import React, { StrictMode, startTransition } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/* -----------------------------------------------------
   1) Custom Global Error Boundary (no white screen)
----------------------------------------------------- */
class OracleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, message: error?.message || "Lỗi không xác định" };
  }

  componentDidCatch(error: any, info: any) {
    console.error("🚨 OracleErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-black/80 text-red-400">
          <h2 className="text-2xl font-bold mb-4">⚠ Oracle Encountered an Error</h2>
          <p className="text-gray-300 mb-6">{this.state.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-oracle-gold text-black rounded font-bold"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* -----------------------------------------------------
   2) Root element validation
----------------------------------------------------- */
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("🔥 Root element #root không tồn tại!");
}

/* -----------------------------------------------------
   3) React 19 createRoot
----------------------------------------------------- */
const root = ReactDOM.createRoot(rootElement);

/* -----------------------------------------------------
   4) Conditional Strict Mode
   (Avoid double API calls in production)
----------------------------------------------------- */
const ENABLE_STRICT =
  (import.meta as any)?.env?.DEV || process.env.NODE_ENV !== "production";

/* -----------------------------------------------------
   5) Performance timing marks
----------------------------------------------------- */
performance.mark("oracle-app-start");

/* -----------------------------------------------------
   6) Non-blocking mount (faster UI)
----------------------------------------------------- */
startTransition(() => {
  root.render(
    ENABLE_STRICT ? (
      <StrictMode>
        <OracleErrorBoundary>
          <App />
        </OracleErrorBoundary>
      </StrictMode>
    ) : (
      <OracleErrorBoundary>
        <App />
      </OracleErrorBoundary>
    )
  );

  performance.mark("oracle-app-rendered");
  performance.measure(
    "oracle-start-to-render",
    "oracle-app-start",
    "oracle-app-rendered"
  );
  console.log("⚡ Oracle Render Time:", performance.getEntriesByName("oracle-start-to-render")[0].duration, "ms");
});