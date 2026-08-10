import { applicaPatchDomSicuro } from "./lib/domSafetyPatch";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// PRIMA del primo render: robustezza DOM contro lettura/traduzione (vedi
// domSafetyPatch.ts). Stesso accorgimento del sito principale.
applicaPatchDomSicuro();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Manca l'elemento #root su cui montare l'app.");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
