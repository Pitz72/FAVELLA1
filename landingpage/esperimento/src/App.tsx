// ====================================================================
//  «Il Viaggiatore» — orchestratore.
// --------------------------------------------------------------------
//  Cinque fasi: i LOGHI (Runtime, FAVELLA; solo all'avvio), le LICENZE E I
//  CREDITI (subito dopo i loghi), l'AVVISO (che cos'è questo gioco), il TRAILER
//  e il GIOCO (shell 16:9 col motore FAVELLA reale). Dal menu del trailer si
//  comincia un nuovo viaggio o se ne riprende uno salvato; «← intro» dal
//  gioco torna al trailer, ma DIRETTO al menu (non si rivede tutto il filmato).
//  Sopra tutto, sul desktop, l'avviso dell'aggiornamento automatico. Le fasi stanno
//  dentro un confine d'errore (ConfineErrori): se una si rompe, un messaggio e
//  «torna all'intro» al posto dello schermo nero.
// ====================================================================
import { useEffect, useState } from "react";
import Loghi from "./components/Loghi";
import Crediti from "./components/Crediti";
import Avviso from "./components/Avviso";
import { avviaPreparazione } from "./trailer/paesaggi";
import Trailer from "./components/Trailer";
import GameShell from "./components/GameShell";
import AvvisoAggiornamento from "./components/AvvisoAggiornamento";
import ConfineErrori from "./components/ConfineErrori";
import type { Salvataggio } from "./lib/salvataggi";

type Fase = "loghi" | "crediti" | "avviso" | "trailer" | "gioco";

export default function App() {
  const [fase, setFase] = useState<Fase>("loghi");
  // Dopo aver visto il gioco almeno una volta, il trailer riparte dal finale.
  const [giaVisto, setGiaVisto] = useState(false);
  const [carica, setCarica] = useState<Salvataggio | null>(null);
  // una partita nuova (o ricaricata) rimonta il gioco da capo
  const [partita, setPartita] = useState(0);

  // Le tele del trailer (cielo, monti, legno, carta, fango, sale, cemento, rilievo…) si dipingono
  // a pezzi mentre girano i loghi: quando comincia il trailer sono già pronte.
  useEffect(() => { avviaPreparazione(); }, []);

  // dopo un errore di disegno: si ricomincia dal menu d'avvio, con un confine nuovo
  const [ripartenza, setRipartenza] = useState(0);
  const tornaAllIntro = () => { setGiaVisto(true); setFase("trailer"); setRipartenza((n) => n + 1); };

  return (
    <div className="h-full w-full bg-black">
      <ConfineErrori key={ripartenza} onTorna={tornaAllIntro}>
        {fase === "loghi" && <Loghi onFine={() => setFase("crediti")} />}
        {fase === "crediti" && <Crediti onFine={() => setFase("avviso")} />}
        {fase === "avviso" && <Avviso onFine={() => setFase("trailer")} />}
        {fase === "trailer" && (
          <Trailer
            key={giaVisto ? "fine" : "intero"}
            startAtEnd={giaVisto}
            onLaunch={(daCaricare) => { setCarica(daCaricare ?? null); setPartita((n) => n + 1); setGiaVisto(true); setFase("gioco"); }}
          />
        )}
        {fase === "gioco" && <GameShell key={partita} carica={carica} onExit={() => setFase("trailer")} />}
      </ConfineErrori>
      <AvvisoAggiornamento />
    </div>
  );
}
