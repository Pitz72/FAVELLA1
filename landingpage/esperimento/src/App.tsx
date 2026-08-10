// ====================================================================
//  App SEPARATA «Il Viaggiatore» — orchestratore.
// --------------------------------------------------------------------
//  Due fasi: il TRAILER (filmato GSAP in auto-play) e il GIOCO (shell 16:9
//  col motore FAVELLA reale). Il pulsante d'avvio del trailer porta al
//  gioco; «← intro» dal gioco torna al trailer, ma DIRETTO al pulsante
//  d'avvio (non si rivede tutto il filmato).
// ====================================================================
import { useState } from "react";
import Trailer from "./components/Trailer";
import GameShell from "./components/GameShell";

export default function App() {
  const [fase, setFase] = useState<"trailer" | "gioco">("trailer");
  // Dopo aver visto il gioco almeno una volta, il trailer riparte dal finale.
  const [giaVisto, setGiaVisto] = useState(false);

  return (
    <div className="h-full w-full bg-black">
      {fase === "trailer" ? (
        <Trailer
          key={giaVisto ? "end" : "full"}
          startAtEnd={giaVisto}
          onLaunch={() => { setGiaVisto(true); setFase("gioco"); }}
        />
      ) : (
        <GameShell onExit={() => setFase("trailer")} />
      )}
    </div>
  );
}
