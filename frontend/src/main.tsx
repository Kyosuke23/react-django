import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

import { FlashProvider, FlashViewport } from "./components/Flash";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <App />
        <FlashViewport />
      </FlashProvider>
    </BrowserRouter>
  </React.StrictMode>
);