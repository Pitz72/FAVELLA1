import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import GameWindow from './GameWindow'
import './styles.css'

// La stessa build serve due finestre: l'IDE (default) e la finestra di gioco
// dedicata (caricata con hash '#game' dal processo main). Il branch sceglie la
// radice React; le due finestre hanno store zustand indipendenti ma parlano allo
// stesso sidecar (un'unica sessione di gioco, posseduta dalla finestra di gioco).
const isGameWindow = window.location.hash.replace(/^#/, '') === 'game'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>{isGameWindow ? <GameWindow /> : <App />}</React.StrictMode>
)
