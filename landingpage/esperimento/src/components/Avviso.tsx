// ====================================================================
//  L'avviso d'apertura: dopo i loghi, prima del trailer.
// --------------------------------------------------------------------
//  Dice che cos'è questo gioco e come è nato. Compare a ogni avvio (non
//  quando dal gioco si torna all'intro), anche con «riduci movimento»: è
//  una comunicazione, non un effetto. Si legge in circa venti secondi; poi
//  prosegue da solo, oppure subito con Invio, Spazio, Esc o un clic.
//  Il testo è quello dell'autore: collaudo/testo.py verifica che nessuno
//  lo cambi per distrazione.
// ====================================================================
import { useEffect, useRef, useState } from "react";

export const TESTO_AVVISO =
  "Questo gioco, nato come demo del linguaggio di programmazione e motore di narrativa interattiva Favella1, " +
  "è stato generato con un importante ausilio dei modelli LLM della famiglia Claude. " +
  "Lo scopo di questo progetto è quello di mostrare in che modo, tramite design e programmazione, " +
  "uno script narrativo Favella1 possa diventare un gioco distribuibile. " +
  "Buon divertimento.";

// l'ultima frase sta a sé, come un saluto
const SALUTO_FINALE = " Buon divertimento.";

const ATTESA_MASSIMA = 20_000;      // ms: poi prosegue da solo
const DISSOLVENZA = 1_100;          // ms

export default function Avviso({ onFine }: { onFine: () => void }) {
  const [visibile, setVisibile] = useState(false);
  const fatto = useRef(false);
  const fine = useRef(onFine);
  fine.current = onFine;
  const prosegui = () => { if (!fatto.current) { fatto.current = true; fine.current(); } };

  useEffect(() => {
    const ridotto = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const comparsa = window.setTimeout(() => setVisibile(true), ridotto ? 0 : 350);
    const scadenza = window.setTimeout(prosegui, ATTESA_MASSIMA);
    const tasto = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") { e.preventDefault(); prosegui(); }
    };
    window.addEventListener("keydown", tasto);
    return () => { window.clearTimeout(comparsa); window.clearTimeout(scadenza); window.removeEventListener("keydown", tasto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div role="alertdialog" aria-modal="true" aria-label="Avviso" aria-describedby="avviso-testo" onClick={prosegui}
      style={{ position: "fixed", inset: 0, background: "#000", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6vh 8vw", cursor: "pointer", color: "#e6e0d6" }}>
      <div style={{ maxWidth: "40rem", textAlign: "center", opacity: visibile ? 1 : 0,
        transition: `opacity ${DISSOLVENZA}ms ease` }}>
        <p id="avviso-testo" style={{ margin: 0, fontFamily: "'Lora', Georgia, serif", fontSize: "clamp(17px, 2.1vw, 24px)",
          lineHeight: 1.7, textWrap: "balance" } as React.CSSProperties}>
          {TESTO_AVVISO.replace(SALUTO_FINALE, "")}
        </p>
        <p style={{ margin: "1.1em 0 0", fontFamily: "'Lora', Georgia, serif", fontStyle: "italic", fontSize: "clamp(17px, 2.1vw, 24px)",
          color: "rgba(230,223,210,.82)" }}>
          {SALUTO_FINALE.trim()}
        </p>
        <button autoFocus onClick={(e) => { e.stopPropagation(); prosegui(); }}
          style={{ marginTop: "min(7vh, 56px)", cursor: "pointer", fontFamily: "'Source Code Pro', ui-monospace, monospace",
            fontSize: 11, letterSpacing: ".24em", textTransform: "uppercase", color: "rgba(230,223,210,.7)",
            background: "transparent", border: "1px solid rgba(230,223,210,.28)", borderRadius: 999, padding: "9px 20px" }}>
          continua
        </button>
      </div>
    </div>
  );
}
