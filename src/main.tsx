import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";
import "leaflet/dist/leaflet.css";

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: "#0d0d0d", color: "#fff", fontFamily: "monospace", padding: "40px", minHeight: "100vh" }}>
          <h1 style={{ color: "#ef4444", fontSize: "20px", marginBottom: "16px" }}>⚠ App crashed — root error</h1>
          <pre style={{ background: "#1a1a1a", padding: "20px", borderRadius: "8px", overflowX: "auto", color: "#fca5a5", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
