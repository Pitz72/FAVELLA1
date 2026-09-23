// ====================================================================
//  «Il Viaggiatore» — orchestratore.
// --------------------------------------------------------------------
//  Tre fasi: i LOGHI (Runtime, FAVELLA; solo all'avvio), il TRAILER e il
//  GIOCO (shell 16:9 col motore FAVELLA reale). Dal menu del trailer si
//  comincia un nuovo viaggio o se ne riprende uno salvato; «← intro» dal
//  gioco torna al trailer, ma DIRETTO al menu (non si rivede tutto il filmato).
//  Sopra tutto, sul desktop, l'avviso dell'aggiornamento automatico.
// ====================================================================
import { useState } from "react";
import Loghi from "./components/Loghi";
import Trailer from "./components/Trailer";
import GameShell from "./components/GameShell";
import AvvisoAggiornamento from "./components/AvvisoAggiornamento";
import type { Salvataggio } from "./lib/salvataggi";

type Fase = "loghi" | "trailer" | "gioco";

export default function App() {
  const [fase, setFase] = useState<Fase>("loghi");
  // Dopo aver visto il gioco almeno una volta, il trailer riparte dal finale.
  const [giaVisto, setGiaVisto] = useState(false);
  const [carica, setCarica] = useState<Salvataggio | null>(null);
  // una partita nuova (o ricaricata) rimonta il gioco da capo
  const [partita, setPartita] = useState(0);

  return (
    <div className="h-full w-full bg-black">
      {fase === "loghi" && <Loghi onFine={() => setFase("trailer")} />}
      {fase === "trailer" && (
        <Trailer
          key={giaVisto ? "fine" : "intero"}
          startAtEnd={giaVisto}
          onLaunch={(daCaricare) => { setCarica(daCaricare ?? null); setPartita((n) => n + 1); setGiaVisto(true); setFase("gioco"); }}
        />
      )}
      {fase === "gioco" && <GameShell key={partita} carica={carica} onExit={() => setFase("trailer")} />}
      <AvvisoAggiornamento />
    </div>
  );
}
