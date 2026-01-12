
import React from "react";
import "./src/index.css";
import ReactDOM from "react-dom/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";
import App from "./App";
import { authClient } from "./src/lib/neonAuth";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <NeonAuthUIProvider authClient={authClient} redirectTo="/">
      <App />
    </NeonAuthUIProvider>
  </React.StrictMode>
);
