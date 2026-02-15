import React from "react";
import "./App.css";
import { AppProvider } from "./context/AppContext";
import { Sidebar } from "./components/sidebar/Sidebar";
import { GraphCanvas } from "./components/graph/GraphCanvas";
import { DetailsPanel } from "./components/panels/DetailsPanel";
import { Toolbar } from "./components/toolbar/Toolbar";
import { Toaster } from "./components/ui/sonner";

const MainApp = () => {
  return (
    <div className="app-container" data-testid="app-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Graph Area */}
      <div className="graph-canvas" data-testid="graph-canvas">
        <Toolbar />
        <GraphCanvas />
        <DetailsPanel />
      </div>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "font-sans",
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
