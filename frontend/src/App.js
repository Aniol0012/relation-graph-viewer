import React from "react";
import "./App.css";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/sidebar/Sidebar";
import { GraphCanvas } from "./components/graph/GraphCanvas";
import { DetailsPanel } from "./components/panels/DetailsPanel";
import { Toolbar } from "./components/toolbar/Toolbar";
import { Toaster } from "./components/ui/sonner";
import { LocalStorageUsageBadge } from "./components/indicators/LocalStorageUsageBadge";

const MainApp = () => {
  return (
    <div className="app-container" data-testid="app-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Graph Area */}
      <div className="graph-canvas" data-testid="graph-canvas">
        <Toolbar />
        <LocalStorageUsageBadge />
        <GraphCanvas />
        <DetailsPanel />
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-left"
        offset={{ top: 16, left: 296 }}
        expand
        richColors
        closeButton
        visibleToasts={2}
        toastOptions={{
          className: "font-sans toast-card toast-compact",
          duration: 2600,
        }}
      />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
