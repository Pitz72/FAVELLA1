// ====================================================================
//  I loghi all'avvio: Runtime Multimedia, poi FAVELLA 1, poi l'avviso.
// --------------------------------------------------------------------
//  Due loghi che si creano davanti a chi guarda (src/loghi/): lo schermo di
//  Runtime che si accende, scrive il marchio e si spegne come un tubo
//  catodico; il simbolo di FAVELLA che si compone pezzo per pezzo, con la
//  scritta e il motto battuto a macchina. Un solo orologio
//  (requestAnimationFrame) per tutti e due: ogni logo riceve il suo tempo e
//  scrive soltanto stili e attributi. Il suono (src/loghi/suono.ts) si
//  programma tutto all'inizio sul clock dell'audio, e l'orologio delle
//  immagini parte con lui. Si parte a caratteri caricati, perché scritta e
//  motto di FAVELLA si misurano su Sora e Inter.
//  Esc salta i loghi. Con «riduci movimento» non si mostrano.
//  Solo in sviluppo: ?loghi=3.2 ferma l'orologio a quel secondo (muto);
//  window.__loghiT lo sposta, window.__rendiSuonoLoghi rende l'audio in un
//  file (vedi src/loghi/esporta.ts): servono a esportare i video dei loghi.
// ====================================================================
import { useEffect, useRef, useState } from "react";
import LogoRuntime, { DURATA_RUNTIME, type Animabile } from "../loghi/LogoRuntime";
import LogoFavella, { DURATA_FAVELLA } from "../loghi/LogoFavella";
import { SuonoLoghi } from "../loghi/suono";

const CODA = 0.35;   // nero dopo l'ultimo logo
const DURATA = DURATA_RUNTIME + DURATA_FAVELLA + CODA;
const CARATTERI = ["700 100px Sora", "400 40px Inter"];

const fermo = (() => {
  if (!import.meta.env.DEV) return null;
  const v = new URLSearchParams(location.search).get("loghi");
  return v !== null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;
})();
if (import.meta.env.DEV) import("../loghi/esporta").then((m) => m.installa());

export default function Loghi({ onFine }: { onFine: () => void }) {
  const runtime = useRef<Animabile>(null);
  const favella = useRef<Animabile>(null);
  const [pronti, setPronti] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const chiudi = () => { if (!fatto.current && fermo === null) { fatto.current = true; fine.current(); } };

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { chiudi(); return; }
    let vivo = true;
    const caratteri = Promise.all(CARATTERI.map((f) => document.fonts?.load(f).catch(() => null)));
    Promise.race([caratteri, new Promise((r) => setTimeout(r, 1500))])
      .then(() => { if (vivo) { favella.current?.prepara?.(); setPronti(true); } });
    const tasto = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); chiudi(); } };
    window.addEventListener("keydown", tasto);
    return () => { vivo = false; window.removeEventListener("keydown", tasto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pronti) return;
    const suono = fermo === null ? SuonoLoghi.avvia() : null;
    let raf = 0;
    const t0 = performance.now() + (suono?.anticipo ?? 0) * 1000;
    const passo = (ora: number) => {
      const t = fermo !== null ? ((window as unknown as { __loghiT?: number }).__loghiT ?? fermo) : (ora - t0) / 1000;
      // in sviluppo, per esportare un logo alla volta: window.__loghiSolo = "runtime" | "favella"
      const solo = import.meta.env.DEV ? (window as unknown as { __loghiSolo?: string }).__loghiSolo : undefined;
      if (solo !== "favella") runtime.current?.aggiorna(t);
      if (solo !== "runtime") favella.current?.aggiorna(t - DURATA_RUNTIME);
      if (t >= DURATA) { chiudi(); if (fermo === null) return; }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => { cancelAnimationFrame(raf); suono?.sfuma(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronti]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", cursor: "none", overflow: "hidden", userSelect: "none" }}
      aria-label="Loghi di apertura">
      <LogoRuntime ref={runtime} />
      <LogoFavella ref={favella} />
    </div>
  );
}
