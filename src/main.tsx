import React from "react";
import ReactDOM from "react-dom/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import App from "../App";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { authClient } from "./lib/neonAuth";

// Force a light theme on load to avoid a dark-mode fallback.
try {
  localStorage.setItem("hf-theme", "light");
  document.documentElement.classList.remove("dark");
} catch {
  // Ignore storage errors (e.g. disabled storage).
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NeonAuthUIProvider authClient={authClient} redirectTo="/">
      <App />
    </NeonAuthUIProvider>
  </React.StrictMode>
);
