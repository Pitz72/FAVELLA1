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

if (new URLSearchParams(location.search).has("autoverifica")) {
  // Modalità di collaudo: niente trailer, solo il resoconto a schermo.
  const pre = document.createElement("pre");
  pre.style.cssText = "margin:0;padding:24px;color:#e8f0f8;font:14px/1.5 monospace;white-space:pre-wrap";
  rootElement.appendChild(pre);
  import("./autoverifica").then(({ autoverifica }) => autoverifica((r) => { pre.textContent += `${r}\n`; }));
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
