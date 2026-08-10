import { applicaPatchDomSicuro } from './lib/domSafetyPatch';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// PRIMA del primo render: rende l'app resistente agli strumenti che alterano il
// DOM (lettura ad alta voce di Edge, screen reader, traduzione automatica), così
// non crasha con «removeChild NotFoundError». Vedi domSafetyPatch.ts.
applicaPatchDomSicuro();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
